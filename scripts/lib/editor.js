// editor.js — 네이버 스마트에디터 ONE 입력 공용 헬퍼
//
// CLAUDE.md §8(실측 지식)을 그대로 반영한다. 셀렉터가 실패하면 추측으로 고치지 말고
// probe_selectors.js로 실제 DOM을 떠서 실측 후 여기 상수만 고친다.
//
// ⚠ 검증 상태
//   확인됨: 본문/제목/인용구/구분선/태그/발행버튼/작성중팝업 셀렉터.
//   미검증(첫 실행 시 probe 필요): 소제목 서식 드롭다운 옵션·글자크기(fs19),
//                                   이미지 업로드 버튼, 유튜브 임베드 경로.

export const SEL = {
  editorFrame: 'iframe#mainFrame',
  bodyParagraph: '.se-section-text p.se-text-paragraph', // 본문 한정(넓히면 제목 오염)
  title: '.se-title-text',
  draftPopupCancel: '.se-popup-button-cancel', // "작성 중인 글" → 새로 쓰기
  quoteBtn: '.se-insert-quotation-default-toolbar-button',
  hrBtn: '.se-insert-horizontal-line-default-toolbar-button',
  formatBtn: '.se-text-format-toolbar-button', // 문단 서식 드롭다운(소제목/본문)
  publishBtn: 'button[data-testid="seOnePublishBtn"]', // 진짜 발행(가드가 차단)
  tagInput: 'input#tag-input',
  // 아래는 미검증 후보 — probe로 확정할 것
  imageBtnCandidates: [
    '.se-image-toolbar-button',
    'button.se-toolbar-button-image',
    '[data-name="image"]',
  ],
  videoBtnCandidates: [
    '.se-video-toolbar-button',
    'button.se-toolbar-button-video',
    '[data-name="video"]',
  ],
  oglinkBtnCandidates: [
    '.se-oglink-toolbar-button',
    'button.se-toolbar-button-oglink',
    '[data-name="oglink"]',
  ],
  saveBtnCandidates: [
    'button[data-testid="seOneSaveBtn"]',
    'button.save_btn__bzc5B',
    'button:has-text("저장")',
  ],
};

const EMOJI_RE = /\p{Extended_Pictographic}/u;

/** 실행 결과 트래커 — 로그 끝에 "자동 처리 결과" 블록으로 출력한다. */
export function makeResult() {
  return {
    items: {}, // name -> { ok:boolean, note:string }
    mark(name, ok, note = '') { this.items[name] = { ok, note }; },
    print() {
      console.log('\n================ 자동 처리 결과 ================');
      for (const [name, v] of Object.entries(this.items)) {
        console.log(`${v.ok ? '✅' : '❗수동필요'}  ${name}${v.note ? ' — ' + v.note : ''}`);
      }
      const fails = Object.entries(this.items).filter(([, v]) => !v.ok).map(([k]) => k);
      if (fails.length) console.log(`\n▶ 수동 확인 필요: ${fails.join(', ')}`);
      console.log('================================================\n');
    },
  };
}

/** 에디터 프레임(iframe#mainFrame 내부, 없으면 top) 확보 + 본문/제목 로드 대기. */
export async function getEditorFrame(page) {
  await page.waitForSelector(SEL.editorFrame, { timeout: 30000 }).catch(() => {});
  let frame = page.frame({ name: 'mainFrame' });
  if (!frame) {
    const el = await page.$(SEL.editorFrame);
    if (el) frame = await el.contentFrame();
  }
  if (!frame) frame = page.mainFrame();
  await frame.waitForSelector(`${SEL.bodyParagraph}, ${SEL.title}`, { timeout: 30000 });
  return frame;
}

/** "작성 중인 글" 팝업이 뜨면 새로 쓰기로 닫는다. */
export async function dismissDraftPopup(frame) {
  await frame.click(SEL.draftPopupCancel, { timeout: 3000 }).catch(() => {});
}

/** 한글 안전 입력: keyboard.insertText 사용, 이모지는 분리 삽입(IME/유실 회피). */
export async function insertText(page, text) {
  let buf = '';
  for (const ch of Array.from(text)) {
    if (EMOJI_RE.test(ch)) {
      if (buf) { await page.keyboard.insertText(buf); buf = ''; }
      await page.keyboard.insertText(ch);
    } else {
      buf += ch;
    }
  }
  if (buf) await page.keyboard.insertText(buf);
}

/** 여러 줄: 줄마다 insertText 후 Enter(마지막 줄 제외)로 문단 생성. */
export async function insertLines(page, text) {
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]) await insertText(page, lines[i]);
    if (i < lines.length - 1) await page.keyboard.press('Enter');
  }
}

/** 본문 첫 문단에 포커스. */
export async function focusBody(frame) {
  const first = frame.locator(SEL.bodyParagraph).first();
  await first.click();
}

/** 소제목 서식 적용(서식→크기→입력→본문 복귀). 실패해도 텍스트는 일반 문단으로 남긴다. */
export async function insertSubtitle(page, frame, text, result) {
  let formatted = false;
  try {
    await frame.click(SEL.formatBtn, { timeout: 3000 });
    // 드롭다운에서 "소제목" 선택 (미검증: 텍스트 기반)
    await frame.getByText('소제목', { exact: true }).click({ timeout: 2000 });
    // 글자 크기 19(fs19)로 — 미검증. 실패해도 진행.
    await frame.click('.se-font-size-code-toolbar-button', { timeout: 1500 }).catch(() => {});
    await frame.getByText('19', { exact: true }).click({ timeout: 1500 }).catch(() => {});
    formatted = true;
  } catch {
    formatted = false;
  }
  await insertText(page, text);
  await page.keyboard.press('Enter');
  // 다음 문단 "본문"으로 복귀 (미검증)
  if (formatted) {
    try {
      await frame.click(SEL.formatBtn, { timeout: 2000 });
      await frame.getByText('본문', { exact: true }).click({ timeout: 2000 });
    } catch { /* 복귀 실패는 다음 블록 처리에서 육안 확인 */ }
  }
  if (result) result.mark(`소제목("${text}")`, formatted, formatted ? '' : '서식 미적용 — 일반 문단으로 입력됨(probe 필요)');
}

/** 인용구 삽입. */
export async function insertQuote(page, frame, text) {
  await frame.click(SEL.quoteBtn);
  await insertLines(page, text);
}

/** 구분선 삽입. */
export async function insertDivider(frame) {
  await frame.click(SEL.hrBtn);
}

/** 첫 번째로 존재하는 셀렉터 후보를 클릭. */
async function clickFirst(frame, candidates, timeout = 2500) {
  for (const sel of candidates) {
    const loc = frame.locator(sel).first();
    if (await loc.count().catch(() => 0)) {
      try { await loc.click({ timeout }); return sel; } catch { /* 다음 후보 */ }
    }
  }
  return null;
}

/** 이미지 업로드(파일 선택창). 미검증 버튼 후보 사용. */
export async function insertImage(page, frame, absPath, caption, result) {
  try {
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 8000 }),
      clickFirst(frame, SEL.imageBtnCandidates),
    ]);
    await chooser.setFiles(absPath);
    await page.waitForTimeout(2500); // 업로드 대기
    if (caption) {
      // 캡션 입력은 이미지마다 편차 — 실패 허용
      await insertText(page, caption).catch(() => {});
    }
    if (result) result.mark(`이미지(${absPath})`, true);
  } catch (e) {
    if (result) result.mark(`이미지(${absPath})`, false, '업로드 버튼/파일창 미확인(probe 필요): ' + e.message);
  }
}

/**
 * 유튜브 링크 임베드 — ⚠ 미검증. 첫 실행 시 probe로 경로 확정 필요.
 * 우선 동영상 URL 임베드 → 실패 시 외부링크(oglink) 카드로 폴백.
 */
export async function insertYoutube(page, frame, url, title, result) {
  let ok = false;
  try {
    await clickFirst(frame, SEL.videoBtnCandidates);
    // 팝업에서 URL 입력 후보 (미검증)
    const urlInput = frame.locator('input[placeholder*="URL"], input[type="url"], input[placeholder*="주소"]').first();
    await urlInput.fill(url, { timeout: 3000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    ok = true;
  } catch { ok = false; }
  if (!ok) {
    try {
      await clickFirst(frame, SEL.oglinkBtnCandidates);
      const linkInput = frame.locator('input[placeholder*="링크"], input[type="url"]').first();
      await linkInput.fill(url, { timeout: 3000 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      ok = true;
    } catch { ok = false; }
  }
  if (result) result.mark('유튜브 임베드', ok, ok ? '' : '동영상/링크 임베드 경로 미확인 — probe 후 수정, 우선 수동 첨부');
}

/** 제목 입력(맨 마지막) + 검증 후 불일치 시 재입력. */
export async function setTitleVerified(page, frame, title, result) {
  const t = frame.locator(SEL.title);
  await t.click();
  await insertText(page, title);
  await page.waitForTimeout(300);
  let actual = (await t.innerText().catch(() => '')).trim();
  if (actual.replace(/\s+/g, '') !== title.replace(/\s+/g, '')) {
    // 전체 선택 후 삭제 → 재입력
    await t.click();
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    await insertText(page, title);
    await page.waitForTimeout(300);
    actual = (await t.innerText().catch(() => '')).trim();
  }
  const ok = actual.replace(/\s+/g, '') === title.replace(/\s+/g, '');
  if (result) result.mark('제목', ok, ok ? '' : `실제="${actual}"`);
  return ok;
}

/** 태그 입력: 발행 패널 열기 → 칩 확정 → Escape로 패널만 닫기. (발행 가드 전제) */
export async function addTags(page, frame, tags, result) {
  if (!tags || !tags.length) { if (result) result.mark('태그', true, '없음'); return; }
  try {
    // 발행 패널 열기(진짜 발행 버튼과 같은 영역) — 가드가 발행을 차단한다.
    await frame.click(SEL.publishBtn, { timeout: 5000 });
    await frame.waitForSelector(SEL.tagInput, { timeout: 5000 });
    const clean = tags.map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean).slice(0, 30);
    for (const tag of clean) {
      await frame.fill(SEL.tagInput, tag);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(150);
    }
    // 검증: 태그 영역 텍스트를 #로 분할해 카운트
    const areaText = await frame.locator('.tag_area, [class*="tag"]').first().innerText().catch(() => '');
    const count = (areaText.match(/#/g) || []).length;
    await page.keyboard.press('Escape'); // 패널만 닫기
    await page.waitForTimeout(500);
    const ok = count >= clean.length;
    if (result) result.mark('태그', ok, `요청 ${clean.length}개 / 감지 ${count}개`);
  } catch (e) {
    await page.keyboard.press('Escape').catch(() => {});
    if (result) result.mark('태그', false, '패널/입력 실패(probe 필요): ' + e.message);
  }
}

/** 임시저장 클릭(또는 dry-run 시 생략). */
export async function saveDraft(page, frame, dryRun, result) {
  if (dryRun) {
    if (result) result.mark('임시저장', true, 'dry-run: 저장 클릭 생략');
    console.log('  [dry-run] 임시저장 클릭을 생략했습니다.');
    return;
  }
  const clicked = await clickFirst(frame, SEL.saveBtnCandidates, 4000);
  if (clicked) {
    await page.waitForTimeout(2500);
    if (result) result.mark('임시저장', true);
  } else {
    if (result) result.mark('임시저장', false, '저장 버튼 미확인(probe 필요)');
  }
}

/** 본문 첫 줄 보정: 저장 전 첫 문단이 초안 첫 줄로 시작하는지 검사, 누락 시 맨 앞 삽입. */
export async function ensureFirstLine(page, frame, expectedFirst, result) {
  try {
    const first = (await frame.locator(SEL.bodyParagraph).first().innerText().catch(() => '')).trim();
    const head = expectedFirst.slice(0, 12).replace(/\s+/g, '');
    if (!first.replace(/\s+/g, '').includes(head.slice(0, 8))) {
      const firstEl = frame.locator(SEL.bodyParagraph).first();
      await firstEl.click();
      await page.keyboard.press('Home');
      await insertText(page, expectedFirst + '\n');
      if (result) result.mark('본문 첫 줄 보정', true, '누락 감지 → 앞에 삽입');
    }
  } catch { /* 검사 실패는 텍스트 덤프 검증에서 재확인 */ }
}
