// We are initializing upstash redis to be able to store the refresh tokens

import Redis from "ioredis"
import dotenv from 'dotenv';

dotenv.config();

export const redis = new Redis(process.env.UPSTASH_REDIS_URL);

/*
redis is a key-value store(kinda like json)
await redis.set('foo','bar');   here key if foo. value is bar

how to run this file specifically?
node .\backend\lib\redis.js
*/