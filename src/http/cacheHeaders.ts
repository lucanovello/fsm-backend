import type { Response } from "express";

const SLOW_CACHE_MAX_AGE_SECONDS = 300;
const SLOW_CACHE_STALE_SECONDS = 60;

export const cacheSlowChangingResponse = (res: Response): void => {
  res.setHeader(
    "Cache-Control",
    `public, max-age=${SLOW_CACHE_MAX_AGE_SECONDS}, stale-while-revalidate=${SLOW_CACHE_STALE_SECONDS}`,
  );
};
