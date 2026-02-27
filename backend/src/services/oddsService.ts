import axios from 'axios';

const API_KEY = process.env.ODDS_API_KEY;
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

export const fetchCricketOdds = async () => {
    try {
        const sportKey = 'cricket_t20_intl';
        const response = await axios.get(`${BASE_URL}/${sportKey}/odds`, {
            params: {
                apiKey: API_KEY,
                regions: 'intl',
                markets: 'h2h',
                oddsFormat: 'decimal'
            }
        });

        return response.data.map((event: any) => ({
            eventId: event.id,
            homeTeam: event.home_team,
            awayTeam: event.away_team,
            commenceTime: event.commence_time,
            odds: event.bookmakers?.[0]?.markets?.[0]?.outcomes || []
        }));
    } catch (error) {
        console.error('Error in fetchCricketOdds:', error);
        throw error;
    }
};
