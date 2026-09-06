// probe_selectors.js — 셀렉터 진단(읽기 전용). 클릭·저장·발행 없음.
//
// 사용:  node scripts/probe_selectors.js
// 에디터의 실제 DOM(툴바 버튼·입력창·주요 셀렉터 존재 여부)을 drafts/에 덤프한다.
// 셀렉터가 바뀌어 실패할 때, 추측 대신 이걸로 실측하고 editor.js/CLAUDE.md §8을 고친다.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { armPublishGuardOnContext, guardAllFrames } from './lib/publishGuard.js';
import { SEL, getEditorFrame, dismissDraftPopup } from './lib/editor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const USER_DATA_DIR = path.resolve(ROOT, 'naver-profile');
const BLOG_ID = process.env.NAVER_BLOG_ID || 'haem_z';

async function main() {
  if (!fs.existsSync(USER_DATA_DIR)) { console.error('✗ 로그인 세션이 없습니다. 먼저 `npm run login`을 실행하세요.'); process.exit(1); }

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1600, height: 1000 },
  });
  await armPublishGuardOnContext(context);
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(`https://blog.naver.com/${BLOG_ID}?Redirect=Write`, { waitUntil: 'domcontentloaded' });
  const frame = await getEditorFrame(page);
  await guardAllFrames(page);
  await dismissDraftPopup(frame);
  await page.waitForTimeout(1500);

  // 모든 버튼/입력 요소의 식별 정보 수집(읽기 전용)
  const dump = await frame.evaluate(() => {
    const pick = (el) => ({
      tag: el.tagName.toLowerCase(),
      cls: el.className && el.className.toString().slice(0, 160),
      testid: el.getAttribute('data-testid') || '',
      dataname: el.getAttribute('data-name') || '',
      aria: el.getAttribute('aria-label') || el.getAttribute('title') || '',
      text: (el.innerText || el.value || '').trim().slice(0, 40),
    });
    const buttons = [...document.querySelectorAll('button, [role="button"], a.se-toolbar-item')].map(pick);
    const inputs = [...document.querySelectorAll('input, textarea')].map(pick);
    return { buttons, inputs };
  });

  // 알려진 셀렉터 존재 여부 점검
  const known = {};
  for (const [name, sel] of Object.entries(SEL)) {
    if (typeof sel !== 'string') continue;
    known[name] = await frame.locator(sel).count().catch(() => 0);
  }

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const out = path.join(ROOT, 'drafts', `probe-${ts}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ url: page.url(), known, dump }, null, 2));

  console.log(`\n✓ DOM 덤프 저장: ${path.relative(ROOT, out)}`);
  console.log('  known(알려진 셀렉터 매칭 개수):');
  for (const [k, v] of Object.entries(known)) console.log(`    ${v > 0 ? '✅' : '❌'} ${k} = ${v}  (${SEL[k]})`);
  console.log(`\n  버튼 ${dump.buttons.length}개 / 입력 ${dump.inputs.length}개. 유튜브·이미지·소제목/크기 버튼은 이 덤프에서 실제 class/testid를 찾아 editor.js SEL을 고치세요.`);
  console.log('  창을 열어둡니다. 직접 확인 후 닫으세요. (클릭/저장/발행 안 함)');
  await new Promise(() => {});
}

main().catch((e) => { console.error('✗ 오류:', e.message); process.exit(1); });
