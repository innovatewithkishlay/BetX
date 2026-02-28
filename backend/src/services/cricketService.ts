import axios from 'axios';

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = 'https://api.cricapi.com/v1';

export const fetchCurrentMatches = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/currentMatches?apikey=${API_KEY}`, { timeout: 25000 });
        const data = response.data;

        if (data.status !== 'success') {
            console.error('Cricket API Error Status:', data.status, data.reason || '');
            throw new Error(`Cricket API failed: ${data.status}`);
        }

        if (!data.data || !Array.isArray(data.data)) {
            return [];
        }

        return data.data.map((match: any) => {
            const teams = match.teams || [];
            return {
                id: match.id,
                teamA: teams[0] || 'TBA',
                teamB: teams[1] || 'TBA',
                startTime: match.dateTimeGMT,
                status: match.status,
                score: match.score || [],
                name: match.name || 'Unknown Match',
                matchStarted: match.matchStarted,
                matchEnded: match.matchEnded
            };
        });
    } catch (error: any) {
        console.error('Error in fetchCurrentMatches:', error.message);
        if (error.response) {
            console.error('API Response Error:', error.response.status, error.response.data);
        }
        throw error;
    }
};

export const fetchMatchDetails = async (matchId: string) => {
    try {
        const response = await axios.get(`${BASE_URL}/match_info?apikey=${API_KEY}&id=${matchId}`);
        const data = response.data;

        if (data.status !== 'success') {
            console.error('Cricket API Match Info Error:', data.status, data.reason || '');
            throw new Error(`Failed to fetch match details: ${data.status}`);
        }

        return data.data;
    } catch (error: any) {
        console.error('Error in fetchMatchDetails:', error.message);
        if (error.response) {
            console.error('API Response Error:', error.response.status, error.response.data);
        }
        throw error;
    }
};
