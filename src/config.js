import 'dotenv/config';

/**
 * 환경변수를 읽어 애플리케이션 설정 객체로 정리한다.
 * 값이 없어도 예외를 던지지 않고, 실제 사용하는 명령에서 필요한 값만 검증한다.
 */
export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
  },
  platform: (process.env.PLATFORM || 'tistory').toLowerCase(),
  tistory: {
    blog: process.env.TISTORY_BLOG,
    id: process.env.TISTORY_ID,
    pw: process.env.TISTORY_PW,
  },
  naver: {
    id: process.env.NAVER_ID,
    pw: process.env.NAVER_PW,
  },
  headless: process.env.HEADLESS === 'true',
};

/** 필수 값이 없으면 안내 메시지와 함께 종료한다. */
export function requireEnv(value, name) {
  if (!value) {
    console.error(`✗ 환경변수 ${name} 가 설정되지 않았습니다. .env 파일을 확인하세요.`);
    process.exit(1);
  }
  return value;
}
