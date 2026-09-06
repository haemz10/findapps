// naver_draft.js — 초안 JSON → 스마트에디터 자동 입력 → 임시저장 → 자가 검증
//
// 사용:  node scripts/naver_draft.js drafts/<파일>.json [--dry-run]
//
// 규칙: 발행 금지(임시저장까지). installPublishGuard 로 발행 버튼 클릭 원천 차단.
//       본문 전체 먼저 → 제목 맨 마지막. 유튜브는 첫 text 블록 직후.
//       한글은 insertText. 자가 검증(스크린샷 + 텍스트 덤프 전문 대조)까지 하고 끝낸다.

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { armPublishGuardOnContext, guardAllFrames } from './lib/publishGuard.js';
import {
  SEL, makeResult, getEditorFrame, dismissDraftPopup, focusBody,
  insertLines, insertSubtitle, insertQuote, insertDivider, insertImage,
  insertYoutube, setTitleVerified, addTags, saveDraft, ensureFirstLine,
} from './lib/editor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const USER_DATA_DIR = path.resolve(ROOT, 'naver-profile');
const BLOG_ID = process.env.NAVER_BLOG_ID || 'haem_z';

function parseArgs(argv) {
  const dryRun = argv.includes('--dry-run');
  const file = argv.find((a) => a.endsWith('.json'));
  return { dryRun, file };
}

async function main() {
  const { dryRun, file } = parseArgs(process.argv.slice(2));
  if (!file) { console.error('✗ 초안 JSON 경로가 필요합니다. 예: node scripts/naver_draft.js drafts/xxx.json [--dry-run]'); process.exit(1); }
  if (!fs.existsSync(USER_DATA_DIR)) { console.error('✗ 로그인 세션이 없습니다. 먼저 `npm run login`(/setup-login)을 실행하세요.'); process.exit(1); }

  const draft = JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = makeResult();
  const base = path.join(ROOT, 'drafts', path.basename(file, '.json'));

  console.log(`\n▶ 초안: ${draft.title}`);
  console.log(`  블록 ${draft.blocks?.length ?? 0}개, 태그 ${draft.tags?.length ?? 0}개, 유튜브 ${draft.youtube ? 'O' : 'X'}${dryRun ? ' · [dry-run]' : ''}\n`);

  const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1600, height: 1000 },
  });
  await armPublishGuardOnContext(context); // 이후 로드되는 모든 프레임에 가드 사전 주입
  const page = context.pages()[0] || (await context.newPage());

  try {
    await page.goto(`https://blog.naver.com/${BLOG_ID}?Redirect=Write`, { waitUntil: 'domcontentloaded' });
    if (/nidlogin/.test(page.url())) throw new Error('로그인이 풀렸습니다. `npm run login`을 다시 실행하세요.');

    const frame = await getEditorFrame(page);
    await guardAllFrames(page); // 현재 프레임 + 이후 프레임 가드
    await dismissDraftPopup(frame);

    // ── 본문 전체 먼저 ────────────────────────────────────────
    await focusBody(frame);
    const blocks = draft.blocks || [];
    let firstTextDone = false;
    let firstTextContent = '';

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      const next = blocks[i + 1];
      switch (b.type) {
        case 'text':
          await insertLines(page, b.content || '');
          if (!firstTextDone) {
            firstTextDone = true;
            firstTextContent = b.content || '';
            // 유튜브는 첫 text 블록 직후
            if (draft.youtube?.url) {
              await page.keyboard.press('Enter');
              await insertYoutube(page, frame, draft.youtube.url, (draft.youtube.title || draft.title || '').slice(0, 40), result);
            }
          }
          // 연속 text 블록 사이에만 여백 Enter
          if (next && next.type === 'text') await page.keyboard.press('Enter');
          break;
        case 'subtitle':
          await insertSubtitle(page, frame, b.content || '', result);
          break;
        case 'quote':
          await insertQuote(page, frame, b.content || '');
          break;
        case 'divider':
          await insertDivider(frame);
          break;
        case 'image': {
          const abs = path.isAbsolute(b.path) ? b.path : path.resolve(ROOT, b.path);
          if (!fs.existsSync(abs)) { result.mark(`이미지(${b.path})`, false, '파일 없음'); break; }
          await insertImage(page, frame, abs, b.caption, result);
          break;
        }
        default:
          console.log(`  (무시) 알 수 없는 블록 타입: ${b.type}`);
      }
    }

    // 본문 첫 줄 누락 보정
    if (firstTextContent) {
      const firstLine = firstTextContent.split('\n')[0];
      await ensureFirstLine(page, frame, firstLine, result);
    }

    // ── 태그(발행 패널) ──────────────────────────────────────
    await addTags(page, frame, draft.tags, result);

    // ── 제목은 맨 마지막 ─────────────────────────────────────
    await setTitleVerified(page, frame, draft.title || '', result);

    // ── 임시저장 ─────────────────────────────────────────────
    await saveDraft(page, frame, dryRun, result);

    // ── 자가 검증: 스크린샷 + 텍스트 덤프 ────────────────────
    await page.screenshot({ path: `${base}.png`, fullPage: false }).catch(() => {});
    const titleText = (await frame.locator(SEL.title).innerText().catch(() => '')).trim();
    const bodyText = (await frame.locator(SEL.bodyParagraph).allInnerTexts().catch(() => [])).join('\n');
    const dump = `# 제목\n${titleText}\n\n# 본문\n${bodyText}\n`;
    fs.writeFileSync(`${base}.dump.txt`, dump);

    // 간단 대조: 제목 + 각 text 블록 앞부분 포함 여부
    const norm = (s) => s.replace(/\s+/g, '');
    const titleOk = norm(titleText).includes(norm(draft.title || '').slice(0, 10));
    const missing = [];
    for (const b of blocks) {
      if (b.type === 'text' || b.type === 'quote' || b.type === 'subtitle') {
        const head = norm((b.content || '').split('\n')[0]).slice(0, 8);
        if (head && !norm(dump).includes(head)) missing.push((b.content || '').split('\n')[0].slice(0, 20));
      }
    }
    result.mark('제목 덤프 대조', titleOk);
    result.mark('본문 덤프 대조', missing.length === 0, missing.length ? `누락 의심 ${missing.length}건: ${missing.slice(0, 3).join(' / ')}` : '');

    result.print();
    console.log(`  스크린샷: ${base}.png`);
    console.log(`  텍스트 덤프(본검증): ${base}.dump.txt  ← 초안과 전문 대조하세요.`);
    if (!dryRun) console.log('\n※ 임시저장까지만 완료. 발행은 사람이 네이버에서 직접.');
    console.log('※ 브라우저 창을 열어둡니다. 확인 후 직접 닫으세요.');

    // 검수를 위해 창을 바로 닫지 않는다.
    await new Promise(() => {});
  } catch (e) {
    console.error('\n✗ 오류:', e.message);
    console.error('  셀렉터 실패면 `node scripts/probe_selectors.js`로 실제 DOM을 떠서 CLAUDE.md §8/editor.js를 고치세요.');
    console.error('  3회 실패하면 수동 붙여넣기용 원고를 출력하세요.');
    process.exitCode = 1;
    // 디버깅을 위해 창 유지
    await new Promise(() => {});
  }
}

main();
