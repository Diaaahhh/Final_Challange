// src/api.js
import axios from 'axios';
import { API_BASE_URL } from './config';

// Create a specialized Axios instance
const api = axios.create({
    baseURL: API_BASE_URL, // Auto-connects to https://backend...
    withCredentials: true  // Important for cookies/sessions
});

export default api;