import { db } from '../config/firebase';
import { normalizeTeamName, findMatchingOddsMatch } from './matchMappingService';
import { fetchCricketOdds } from './oddsService';

export const importMatch = async (cricketMatch: any) => {
    const { id: cricketId, teamA, teamB, startTime, status, score, name } = cricketMatch;

    // 1. Idempotency Check
    const matchRef = db.collection('matches').doc(cricketId);
    const matchDoc = await matchRef.get();

    if (matchDoc.exists) {
        return { success: true, message: 'Match already exists', matchId: cricketId };
    }

    // 2. Normalize Teams
    const normalizedTeamA = normalizeTeamName(teamA);
    const normalizedTeamB = normalizeTeamName(teamB);

    // 3. Fetch Odds for matching
    let oddsEvent = null;
    try {
        const oddsEvents = await fetchCricketOdds();
        oddsEvent = findMatchingOddsMatch(cricketMatch, oddsEvents);
    } catch (error) {
        console.warn('Failed to fetch odds during import, will use default odds');
    }

    // 4. Batch Preparation
    const batch = db.batch();

    // Match Document
    batch.set(matchRef, {
        id: cricketId,
        name,
        teamA,
        teamB,
        normalizedTeamA,
        normalizedTeamB,
        startTime: new Date(startTime),
        status: status === 'Live' ? 'live' : 'upcoming',
        source: 'api',
        apiIds: { cricketId, oddsId: oddsEvent?.eventId || null },
        score,
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // Market Document (Nested Subcollection)
    const marketId = 'match_winner';
    const marketRef = matchRef.collection('markets').doc(marketId);
    batch.set(marketRef, {
        id: marketId,
        type: 'match_winner',
        status: 'open'
    });

    // Selections (Nested Subcollection)
    // If oddsEvent exists, use its outcomes, otherwise use defaults
    const outcomes = oddsEvent?.odds.length > 0 ? oddsEvent.odds : [
        { name: teamA, price: 1.90 },
        { name: teamB, price: 1.90 }
    ];

    outcomes.forEach((outcome: any, index: number) => {
        const selectionId = `outcome_${index + 1}`;
        const selectionRef = marketRef.collection('selections').doc(selectionId);
        batch.set(selectionRef, {
            id: selectionId,
            name: outcome.name,
            odd: outcome.price,
            source: oddsEvent ? 'odds_api' : 'manual',
            status: 'active',
            lastUpdatedAt: new Date()
        });
    });

    await batch.commit();
    return { success: true, matchId: cricketId };
};

export const createManualMatch = async (matchData: { name: string, teamA: string, teamB: string, startTime: string }) => {
    const { name, teamA, teamB, startTime } = matchData;
    console.log(`[SERVICE] Creating manual match: ${name} (${startTime})`);

    const parsedDate = new Date(startTime);
    if (isNaN(parsedDate.getTime())) {
        console.error(`[ERROR] Invalid date provided for manual match: ${startTime}`);
        throw new Error(`Invalid match start time: ${startTime}. Please use a valid date format.`);
    }

    const matchId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const normalizedTeamA = normalizeTeamName(teamA);
    const normalizedTeamB = normalizeTeamName(teamB);

    const matchRef = db.collection('matches').doc(matchId);
    const batch = db.batch();

    // Match Document
    batch.set(matchRef, {
        id: matchId,
        name,
        teamA,
        teamB,
        normalizedTeamA,
        normalizedTeamB,
        startTime: parsedDate,
        status: 'upcoming',
        source: 'manual',
        apiIds: { cricketId: null, oddsId: null },
        createdAt: new Date(),
        updatedAt: new Date()
    });

    // Default Market
    const marketId = 'match_winner';
    const marketRef = matchRef.collection('markets').doc(marketId);
    batch.set(marketRef, {
        id: marketId,
        type: 'match_winner',
        status: 'open'
    });

    // Default Selections
    const outcomes = [
        { name: teamA, price: 1.90 },
        { name: teamB, price: 1.90 }
    ];

    outcomes.forEach((outcome, index) => {
        const selectionId = `outcome_${index + 1}`;
        const selectionRef = marketRef.collection('selections').doc(selectionId);
        batch.set(selectionRef, {
            id: selectionId,
            name: outcome.name,
            odd: outcome.price,
            source: 'manual',
            status: 'active',
            lastUpdatedAt: new Date()
        });
    });

    try {
        await batch.commit();
        console.log(`[SERVICE] Manual match created: ${matchId}`);
        return { success: true, matchId };
    } catch (error: any) {
        console.error('[SERVICE] Firestore Batch Commit Error:', error);
        throw error;
    }
};

export const addMarketToMatch = async (matchId: string, type: string) => {
    const matchRef = db.collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) throw new Error('Match not found');

    const matchData = matchDoc.data();
    const marketId = `${type}_${Date.now()}`;
    const marketRef = matchRef.collection('markets').doc(marketId);

    const batch = db.batch();

    batch.set(marketRef, {
        id: marketId,
        type: type,
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    if (type === 'match_winner' || type === 'toss') {
        const outcomes = [
            { name: matchData?.teamA || 'Team A', price: 1.90 },
            { name: matchData?.teamB || 'Team B', price: 1.90 }
        ];

        outcomes.forEach((outcome, index) => {
            const selectionId = `outcome_${index + 1}`;
            const selectionRef = marketRef.collection('selections').doc(selectionId);
            batch.set(selectionRef, {
                id: selectionId,
                name: outcome.name,
                odd: outcome.price,
                source: 'manual',
                status: 'active',
                lastUpdatedAt: new Date()
            });
        });
    }

    await batch.commit();
    return { success: true, marketId };
};

export const addSelectionToMarket = async (matchId: string, marketId: string, name: string, initialOdd: number) => {
    const marketRef = db.collection('matches').doc(matchId).collection('markets').doc(marketId);
    const marketDoc = await marketRef.get();

    if (!marketDoc.exists) throw new Error('Market not found');
    if (marketDoc.data()?.status === 'closed') throw new Error('Cannot add selection to a closed market');

    const selectionId = `manual_${Date.now()}`;
    const selectionRef = marketRef.collection('selections').doc(selectionId);

    await selectionRef.set({
        id: selectionId,
        name,
        odd: initialOdd,
        source: 'manual',
        status: 'active',
        lastUpdatedAt: new Date()
    });

    return { success: true, selectionId };
};

export const settleMarket = async (matchId: string, marketId: string, winnerSelectionId: string) => {
    const marketRef = db.collection('matches').doc(matchId).collection('markets').doc(marketId);
    const marketDoc = await marketRef.get();

    if (!marketDoc.exists) throw new Error('Market not found');
    if (marketDoc.data()?.status === 'closed') throw new Error('Market is already closed');

    const batch = db.batch();

    // 1. Close the market
    batch.update(marketRef, {
        status: 'closed',
        winnerSelectionId,
        settledAt: new Date(),
        updatedAt: new Date()
    });

    // 2. Mark selections as won/lost
    const selectionsSnap = await marketRef.collection('selections').get();
    selectionsSnap.docs.forEach(doc => {
        batch.update(doc.ref, {
            status: doc.id === winnerSelectionId ? 'won' : 'lost',
            lastUpdatedAt: new Date()
        });
    });

    await batch.commit();
    return { success: true };
};

export const updateOdd = async (matchId: string, marketId: string, selectionId: string, newOdd: number) => {
    const marketRef = db.collection('matches').doc(matchId).collection('markets').doc(marketId);
    const marketDoc = await marketRef.get();

    if (!marketDoc.exists) throw new Error('Market not found');
    if (marketDoc.data()?.status === 'closed') throw new Error('Cannot update odds of a closed market');

    const selectionRef = marketRef.collection('selections').doc(selectionId);
    await selectionRef.update({
        odd: newOdd,
        lastUpdatedAt: new Date()
    });

    return { success: true };
};
