import axios from 'axios';

const API_URL = "http://localhost:8080";

export const login = async (username, password) => {
  const res = await axios.post(`${API_URL}/login`, { username, password });
  return res.data.token;
};
