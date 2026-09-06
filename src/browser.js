import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { config } from './config.js';

const AUTH_DIR = '.auth';

/** 플랫폼별 로그인 세션(storageState) 파일 경로 */
export function storagePath(platform) {
  return `${AUTH_DIR}/${platform}.json`;
}

/**
 * 브라우저 컨텍스트를 연다. 저장된 로그인 세션이 있으면 재사용한다.
 * @param {string} platform - 'tistory' | 'naver'
 */
export async function openContext(platform) {
  if (!existsSync(AUTH_DIR)) mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: config.headless });
  const statePath = storagePath(platform);
  const context = await browser.newContext(
    existsSync(statePath) ? { storageState: statePath } : {}
  );
  return { browser, context };
}

/** 현재 로그인 상태를 파일로 저장한다. */
export async function saveState(context, platform) {
  await context.storageState({ path: storagePath(platform) });
}
