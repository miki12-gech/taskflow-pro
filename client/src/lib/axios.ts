import axios from 'axios';




const BASE_URL = import.meta.env.PROD ? 'https://taskflow.com/api' : 'http://localhost:4000/api';



export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true // <--- Crucial
});