import axios from 'axios';

const BASE_URL = 'https://maturely-olympics-stipulate.ngrok-free.dev/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});