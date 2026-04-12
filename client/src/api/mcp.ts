import axios from 'axios';

const MCP_URL = 'http://localhost:4000/mcp';

export const sendMessage = async (prompt: string) => {
  const res = await axios.post(MCP_URL, { prompt });
  return res.data.result;
};
