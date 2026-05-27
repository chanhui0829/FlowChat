import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import mcpRouter from './routes/mcp';

const app = express();
const PORT = process.env.PORT || 4000;

// [Fix 4] CORS origin 환경변수화
// 기존 wildcard('*')는 모든 도메인의 요청을 허용하므로 보안 취약
// 환경변수로 허용할 도메인을 명시하고, 콤마로 다중 도메인 지원
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',')
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  })
);

app.use(express.json());

/**
 * [Routing] 도메인별 라우터 등록
 */
app.use('/mcp', mcpRouter);

app.listen(PORT, () => {
  console.log(`🚀 MCP Server is running on http://localhost:${PORT}`);
});
