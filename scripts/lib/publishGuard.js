// publishGuard.js — 절대규칙 2: 진짜 발행 버튼 클릭 원천 차단
//
// 태그 입력을 위해 발행 패널을 열어야 하는데, 그 안에 진짜 발행 버튼
// (button[data-testid="seOnePublishBtn"])이 있다. 실수로라도 눌리지 않도록
// 캡처 단계(capture:true) 클릭 리스너로 stopImmediatePropagation + preventDefault 한다.
// 이 가드는 어떤 경우에도 제거하지 않는다.

export const PUBLISH_BTN_SELECTOR = 'button[data-testid="seOnePublishBtn"]';

// 문서에 주입되는 스크립트 본문(문자열로 addInitScript/evaluate에 전달).
const GUARD_SNIPPET = `(() => {
  if (window.__publishGuardInstalled) return;
  window.__publishGuardInstalled = true;
  const SEL = 'button[data-testid="seOnePublishBtn"]';
  const handler = (e) => {
    const t = e.target;
    if (t && t.closest && t.closest(SEL)) {
      e.stopImmediatePropagation();
      e.preventDefault();
      console.warn('[publishGuard] 발행 버튼 클릭 차단됨');
    }
  };
  // 캡처 단계에서 가장 먼저 가로챈다.
  document.addEventListener('click', handler, true);
  document.addEventListener('mousedown', handler, true);
  document.addEventListener('pointerdown', handler, true);
})();`;

/**
 * 컨텍스트 전체(모든 프레임, 이후 로드 포함)에 가드를 사전 주입한다.
 * @param {import('playwright').BrowserContext} context
 */
export async function armPublishGuardOnContext(context) {
  await context.addInitScript(GUARD_SNIPPET);
}

/**
 * 이미 로드된 프레임에 즉시 주입한다. 내비게이션/프레임 재생성 시 재호출.
 * @param {import('playwright').Frame|import('playwright').Page} frameOrPage
 */
export async function installPublishGuard(frameOrPage) {
  try {
    await frameOrPage.evaluate(GUARD_SNIPPET);
  } catch {
    // 프레임이 아직 준비 안 됐을 수 있음 — 호출측에서 재시도.
  }
}

/**
 * 페이지의 모든 프레임에 주입하고, 이후 새로 뜨는 프레임에도 자동 주입되게 건다.
 * @param {import('playwright').Page} page
 */
export async function guardAllFrames(page) {
  for (const frame of page.frames()) {
    await installPublishGuard(frame);
  }
  page.on('framenavigated', async (frame) => {
    await installPublishGuard(frame);
  });
}
