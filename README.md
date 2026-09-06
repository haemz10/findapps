# 블로그 자동화 (Tistory / Naver)

Node.js 기반 블로그 자동화 도구입니다. **Claude API로 글 초안을 생성**하고, **Playwright 브라우저 자동화로 Tistory/Naver 블로그에 자동 발행**합니다.

> Tistory 공식 글쓰기 API는 종료되었고 Naver는 공식 글쓰기 API가 없어, 발행은 브라우저 자동화 방식으로 동작합니다. 계정 정책상 최초 1회 수동 로그인으로 세션을 저장하는 방식을 권장합니다.

## 1. Node.js 설치

이미 설치되어 있으면 건너뛰세요. (권장: Node.js 18 이상)

```bash
node --version   # v18 이상인지 확인
```

- macOS: `brew install node`
- Windows: <https://nodejs.org> 에서 LTS 설치, 또는 `winget install OpenJS.NodeJS.LTS`
- nvm 사용 시: `nvm install --lts`

## 2. 프로젝트 설치

```bash
npm install
npx playwright install chromium   # 브라우저 엔진 설치
```

## 3. 환경설정

`.env.example` 을 복사해 `.env` 를 만들고 값을 채웁니다.

```bash
cp .env.example .env
```

| 변수 | 설명 |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude API 키 (<https://console.anthropic.com>) |
| `ANTHROPIC_MODEL` | 사용할 모델 (기본 `claude-sonnet-5`) |
| `PLATFORM` | `tistory` 또는 `naver` |
| `TISTORY_BLOG` | 티스토리 주소 (예: `myblog.tistory.com`) |
| `HEADLESS` | 브라우저 표시 여부. 최초 로그인 시 `false` 권장 |

## 4. 로그인 (최초 1회)

브라우저 창이 열리면 직접 로그인하세요. 세션이 `.auth/` 에 저장되어 이후 발행에 재사용됩니다.

```bash
npm run login
```

## 5. 사용법

```bash
# ① AI로 초안만 생성 → output/ 에 JSON 저장
npm run generate -- --topic "홈카페 라떼아트 입문" --keywords "라떼아트,홈카페,커피"

# ② 저장된 초안 발행
npm run publish -- --file output/1700000000000.json

# ③ 생성 + 즉시 발행 (원스텝)
npm run run -- --topic "가을 등산 준비물 체크리스트" --tone "전문적인"
```

### 옵션
- `--topic` : 글 주제 (필수)
- `--tone` : 어조 (기본: "친근하고 읽기 쉬운")
- `--keywords` : 쉼표로 구분한 SEO 키워드

## 6. 정기 발행 (스케줄링)

cron 등으로 `npm run run` 을 예약하면 정기 자동 발행이 가능합니다. 예) 매일 오전 9시:

```cron
0 9 * * * cd /path/to/blog-automation && npm run run -- --topic "오늘의 주제" >> cron.log 2>&1
```

## 프로젝트 구조

```
src/
  cli.js               명령 진입점 (login/generate/publish/run)
  config.js            환경변수 로딩·검증
  generator.js         Claude API 콘텐츠 생성
  browser.js           Playwright 컨텍스트/세션 관리
  publishers/
    tistory.js         티스토리 자동 발행
    naver.js           네이버 자동 발행
```

## 주의사항

- 각 플랫폼의 **자동화 정책 및 이용약관**을 확인하고 본인 계정 범위 내에서 사용하세요.
- 에디터 UI가 바뀌면 `publishers/` 의 셀렉터 조정이 필요할 수 있습니다. `HEADLESS=false` 로 실행해 동작을 눈으로 확인하며 맞추는 것을 권장합니다.
- `.env`, `.auth/` 는 민감정보이므로 커밋되지 않도록 `.gitignore` 에 포함되어 있습니다.
