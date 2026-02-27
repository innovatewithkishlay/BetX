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
