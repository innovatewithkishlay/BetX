import { useState, useCallback, useRef } from 'react';
import api from '@/lib/axios';

export function useAdminOdds() {
    const [updating, setUpdating] = useState<string | null>(null);
    const debounceTimers = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const updateOddDebounced = useCallback((
        matchId: string,
        marketId: string,
        selectionId: string,
        newOdd: number
    ) => {
        const path = `matches/${matchId}/markets/${marketId}/selections/${selectionId}`;

        // Clear existing timer for this specific selection to debounce
        if (debounceTimers.current[path]) {
            clearTimeout(debounceTimers.current[path]);
        }

        // Set a new timer
        debounceTimers.current[path] = setTimeout(async () => {
            try {
                setUpdating(selectionId);
                await api.post('/api/admin/cricket/selection/update-odd', {
                    matchId,
                    marketId,
                    selectionId,
                    newOdd
                });
            } catch (error) {
                console.error('Failed to update odd:', error);
            } finally {
                setUpdating(null);
                delete debounceTimers.current[path];
            }
        }, 300);
    }, []);

    return { updateOddDebounced, updating };
}
