import { openContext, saveState } from '../browser.js';
import { config, requireEnv } from '../config.js';

/**
 * Tistory는 공식 글쓰기 API가 종료되어(2024) 브라우저 자동화로 발행한다.
 * 에디터/로그인 화면의 셀렉터는 Tistory UI 변경 시 조정이 필요할 수 있다.
 */

/**
 * 카카오 로그인 후 세션을 저장한다. HEADLESS=false 로 실행해 캡차/2단계 인증에 직접 대응한다.
 */
export async function login() {
  requireEnv(config.tistory.blog, 'TISTORY_BLOG');
  const { browser, context } = await openContext('tistory');
  const page = await context.newPage();

  console.log('→ 카카오 로그인 페이지로 이동합니다. 창에서 직접 로그인하세요.');
  await page.goto('https://www.tistory.com/auth/login');

  // 계정 정보가 있으면 자동 입력을 시도(선택). 없으면 수동 로그인.
  if (config.tistory.id && config.tistory.pw) {
    try {
      await page.getByRole('link', { name: /카카오/ }).click({ timeout: 5000 });
      await page.fill('input#loginId--1, input[name="loginId"]', config.tistory.id);
      await page.fill('input#password--2, input[name="password"]', config.tistory.pw);
      await page.getByRole('button', { name: /로그인/ }).click();
    } catch {
      console.log('  자동 입력 실패 - 창에서 수동으로 로그인해 주세요.');
    }
  }

  // 로그인 완료(관리 페이지 진입)까지 대기
  await page.waitForURL(/tistory\.com\/(manage|$)/, { timeout: 180_000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await saveState(context, 'tistory');
  console.log('✓ 로그인 세션을 .auth/tistory.json 에 저장했습니다.');
  await browser.close();
}

/**
 * 글을 발행한다.
 * @param {{title: string, html: string, tags?: string[]}} post
 */
export async function publish({ title, html, tags = [] }) {
  const blog = requireEnv(config.tistory.blog, 'TISTORY_BLOG');
  const { browser, context } = await openContext('tistory');
  const page = await context.newPage();

  const writeUrl = `https://${blog}/manage/newpost/`;
  await page.goto(writeUrl, { waitUntil: 'domcontentloaded' });

  // 로그인 세션이 없으면 관리자 로그인으로 튕긴다.
  if (/auth\/login|accounts\.kakao/.test(page.url())) {
    await browser.close();
    throw new Error('로그인 세션이 없습니다. 먼저 `npm run login` 을 실행하세요.');
  }

  // "작성 중인 글 불러오기" 팝업이 뜨면 취소
  await page.getByRole('button', { name: /취소|아니오/ }).click({ timeout: 3000 }).catch(() => {});

  // 제목 입력
  await page.fill('#post-title-inp, textarea[placeholder*="제목"]', title);

  // 본문: HTML 모드로 전환 후 붙여넣기가 가장 안정적이다.
  await page.getByRole('button', { name: /기본모드|HTML/ }).click({ timeout: 3000 }).catch(() => {});
  await page.getByRole('menuitem', { name: 'HTML' }).click({ timeout: 3000 }).catch(() => {});

  // CodeMirror(HTML 모드) 또는 일반 에디터 영역에 입력
  const cm = page.locator('.CodeMirror textarea, .CodeMirror-code').first();
  if (await cm.count()) {
    await page.locator('.CodeMirror').first().click();
    await page.keyboard.insertText(html);
  } else {
    await page.locator('.tox-edit-area iframe, iframe#editor-tistory_ifr')
      .first()
      .contentFrame()
      .locator('body')
      .fill(html)
      .catch(() => {});
  }

  // 태그 입력
  for (const tag of tags) {
    await page.fill('#tagText, input[placeholder*="태그"]', tag).catch(() => {});
    await page.keyboard.press('Enter').catch(() => {});
  }

  // 발행: "완료" → "공개 발행"
  await page.getByRole('button', { name: /완료|발행/ }).first().click();
  await page.getByRole('button', { name: /공개 발행|발행/ }).last().click({ timeout: 5000 }).catch(() => {});

  await page.waitForTimeout(3000);
  console.log(`✓ Tistory 발행 완료: ${title}`);
  await browser.close();
}
