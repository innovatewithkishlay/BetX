import axios from 'axios';

const API_KEY = process.env.CRICKET_API_KEY;
const BASE_URL = 'https://api.cricketdata.org/v1';

export const fetchCurrentMatches = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/currentMatches?apikey=${API_KEY}`);
        const data = response.data;

        if (data.status !== 'success') {
            throw new Error('Failed to fetch from Cricket API');
        }

        return data.data.map((match: any) => ({
            id: match.id,
            teamA: match.teams[0],
            teamB: match.teams[1],
            startTime: match.dateTimeGMT,
            status: match.status,
            score: match.score || [],
            name: match.name
        }));
    } catch (error) {
        console.error('Error in fetchCurrentMatches:', error);
        throw error;
    }
};

export const fetchMatchDetails = async (matchId: string) => {
    try {
        const response = await axios.get(`${BASE_URL}/match_info?apikey=${API_KEY}&id=${matchId}`);
        const data = response.data;

        if (data.status !== 'success') {
            throw new Error('Failed to fetch match details');
        }

        return data.data;
    } catch (error) {
        console.error('Error in fetchMatchDetails:', error);
        throw error;
    }
};
