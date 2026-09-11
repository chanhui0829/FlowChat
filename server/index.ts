import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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
 * [Security] /mcp 요청량 제한 (Rate Limiting)
 * 이유: 로그인 없이도 채팅이 가능하도록 열려있는 엔드포인트라, 인증 없이 IP당
 *       요청 횟수를 제한하지 않으면 봇/스크립트가 직접 이 서버를 두들겨서
 *       OpenRouter 크레딧을 무제한으로 소진시킬 수 있음. CORS는 브라우저에서
 *       다른 출처의 JS 요청만 막을 뿐, curl/스크립트로 직접 호출하는 건 막지
 *       못하므로 별도의 서버 단 제한이 반드시 필요함.
 * 값: IP당 15분에 30회 (일반적인 대화 세션엔 충분하고, 스크립트 남용은 제한)
 */
const mcpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
});

/**
 * [Routing] 도메인별 라우터 등록
 */
app.use('/mcp', mcpLimiter, mcpRouter);

app.listen(PORT, () => {
  console.log(`🚀 MCP Server is running on http://localhost:${PORT}`);
});
