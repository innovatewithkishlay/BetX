import axios from 'axios';
import { auth } from './firebase';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Attach the current Firebase ID token to every request
api.interceptors.request.use(async (config) => {
    const user = auth.currentUser;
    if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
