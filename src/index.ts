// src/index.ts
import app from './app.js';
import { env } from './env.js';

app.listen(env.PORT, () => {
  console.log(`🚀 Sentinel API server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});