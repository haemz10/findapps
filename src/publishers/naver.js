import { openContext, saveState } from '../browser.js';
import { config, requireEnv } from '../config.js';

/**
 * Naver 블로그는 공식 글쓰기 API가 없어 브라우저 자동화로 발행한다.
 * 스마트에디터 ONE 은 iframe 안에서 동작하며, UI 변경 시 셀렉터 조정이 필요할 수 있다.
 * 네이버는 자동 로그인을 강하게 차단하므로 최초 1회 수동 로그인(세션 저장)을 권장한다.
 */

export async function login() {
  const { browser, context } = await openContext('naver');
  const page = await context.newPage();

  console.log('→ 네이버 로그인 페이지로 이동합니다. 창에서 직접 로그인하세요(자동입력 차단됨).');
  await page.goto('https://nid.naver.com/nidlogin.login');

  // 로그인 성공(naver.com 메인 등) 까지 대기
  await page.waitForURL(/naver\.com\/?$|blog\.naver\.com/, { timeout: 180_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await saveState(context, 'naver');
  console.log('✓ 로그인 세션을 .auth/naver.json 에 저장했습니다.');
  await browser.close();
}

/**
 * 글을 발행한다.
 * @param {{title: string, html: string, tags?: string[]}} post
 */
export async function publish({ title, html, tags = [] }) {
  const id = requireEnv(config.naver.id, 'NAVER_ID');
  const { browser, context } = await openContext('naver');
  const page = await context.newPage();

  await page.goto(`https://blog.naver.com/${id}?Redirect=Write`, { waitUntil: 'domcontentloaded' });

  if (/nidlogin/.test(page.url())) {
    await browser.close();
    throw new Error('로그인 세션이 없습니다. 먼저 `npm run login` 을 실행하세요.');
  }

  // 스마트에디터는 mainFrame iframe 안에 있다.
  const frame = page.frameLocator('#mainFrame');

  // 이전 작성 글 복구 팝업 닫기
  await frame.getByRole('button', { name: /취소|닫기/ }).click({ timeout: 3000 }).catch(() => {});

  // 제목
  await frame.locator('.se-title-text .se-text-paragraph, [contenteditable] .se-placeholder')
    .first()
    .click()
    .catch(() => {});
  await page.keyboard.type(title);

  // 본문 (HTML 서식은 스마트에디터가 제한적이라 텍스트 위주로 입력)
  const body = frame.locator('.se-component-content .se-text-paragraph').last();
  await body.click().catch(() => {});
  await page.keyboard.type(htmlToText(html));

  // 발행 버튼 → 설정 팝업의 발행
  await frame.getByRole('button', { name: /발행/ }).first().click({ timeout: 5000 }).catch(() => {});

  // 태그
  for (const tag of tags) {
    await frame.fill('input#tag-input, input[placeholder*="태그"]', tag).catch(() => {});
    await page.keyboard.press('Enter').catch(() => {});
  }

  await frame.getByRole('button', { name: /^발행$|확인/ }).last().click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3000);
  console.log(`✓ Naver 발행 완료: ${title}`);
  await browser.close();
}

/** 스마트에디터는 원본 HTML 삽입이 제한적이므로 태그를 제거해 평문으로 변환한다. */
function htmlToText(html) {
  return html
    .replace(/<\/(p|h[1-6]|li|div)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
