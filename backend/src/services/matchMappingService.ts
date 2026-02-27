export const normalizeTeamName = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '') // remove spaces
        .replace(/[^a-z0-9]/g, '') // remove special characters
        .trim();
};

export const findMatchingOddsMatch = (cricketMatch: any, oddsEvents: any[]) => {
    const normalizedCricketA = normalizeTeamName(cricketMatch.teamA);
    const normalizedCricketB = normalizeTeamName(cricketMatch.teamB);
    const cricketStartTime = new Date(cricketMatch.startTime).getTime();

    // 2 hours tolerance in milliseconds
    const TOLERANCE_MS = 2 * 60 * 60 * 1000;

    return oddsEvents.find((event) => {
        const normalizedOddsHome = normalizeTeamName(event.homeTeam);
        const normalizedOddsAway = normalizeTeamName(event.awayTeam);
        const oddsStartTime = new Date(event.commenceTime).getTime();

        const timeDiff = Math.abs(cricketStartTime - oddsStartTime);

        if (timeDiff > TOLERANCE_MS) return false;

        // Check both orderings
        const matchFound = (
            (normalizedCricketA === normalizedOddsHome && normalizedCricketB === normalizedOddsAway) ||
            (normalizedCricketA === normalizedOddsAway && normalizedCricketB === normalizedOddsHome)
        );

        return matchFound;
    }) || null;
};
