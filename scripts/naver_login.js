// naver_login.js — 최초 1회 로그인 세션 저장 (persistentContext)
//
// 절대규칙: 비밀번호를 저장/자동입력하지 않는다. 사용자가 브라우저에서 직접 로그인한다.
// 세션은 naver-profile/ 에 저장되어 이후 naver_draft.js 가 재사용한다.

import { chromium } from 'playwright';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USER_DATA_DIR = path.resolve(__dirname, '..', 'naver-profile');

function waitForEnter(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(prompt, () => { rl.close(); resolve(); }));
}

async function main() {
  console.log('→ 크롬 창이 열립니다. 창에서 직접 네이버에 로그인하세요(자동 입력하지 않습니다).');
  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1600, height: 1000 },
    args: ['--start-maximized'],
  });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto('https://nid.naver.com/nidlogin.login', { waitUntil: 'domcontentloaded' });

  await waitForEnter(
    '\n로그인이 끝나면(가능하면 블로그까지 접속 확인) 이 터미널에서 Enter를 눌러 세션을 저장하고 종료합니다... '
  );

  // 로그인 상태 간단 확인(로그인 페이지가 아니면 성공으로 간주)
  const url = page.url();
  const loggedIn = !/nidlogin/.test(url);
  console.log(loggedIn ? '✓ 로그인 세션을 저장했습니다.' : '⚠ 아직 로그인 페이지입니다. 로그인 후 다시 실행하세요.');
  console.log(`  세션 경로: ${USER_DATA_DIR} (외부 공유 금지)`);

  await context.close();
}

main().catch((e) => { console.error('✗ 오류:', e.message); process.exit(1); });
