# 네이버 팝송·영어 블로그 자동 초안 작성 툴

블로거 **Volador**(`blog.naver.com/haem_z`)의 **팝송 해석 + 영어 표현 학습** 글을 자동으로 써주는 도구입니다.
곡 정보 + (자작) 사진 + 한줄 메모만 주면 → **Claude Code 세션 안의 AI**가 직접 글을 쓰고 → **승인 후 네이버 임시저장까지** 자동화합니다.

> **이 툴은 "초안 공장"이지 "무인 발행기"가 아닙니다.** 발행 버튼은 항상 사람이 누릅니다.

## 핵심 원칙(절대 규칙)
1. **API 키 없음** — 모든 AI 작업은 Claude Code 세션 안에서(구독 토큰만).
2. **발행 안 함** — 임시저장까지만. 발행 버튼 클릭은 스크립트가 코드로 차단(`installPublishGuard`).
3. **사실 지어내기 없음** — 확인된 것만, 나머지는 사용자에게 질문.
4. **협찬 표기 준수**(공정위) / **직접 해석 정직 표기**.
5. **학습 자동 수집 없음** — 사용자가 준 글로만 스타일/트렌드 갱신.

## 설치

```bash
npm install
npx playwright install chromium     # (일부 환경은 사전 설치되어 있어 생략 가능)
```

## 최초 1회 로그인 (비밀번호 저장 안 함)

```bash
npm run login          # = /setup-login
```
열리는 크롬 창에서 **직접** 네이버에 로그인 → 터미널에서 Enter로 세션 저장.
세션은 `naver-profile/`에 저장되어 재사용됩니다. **이 폴더는 외부 공유 금지.**

> 로그인은 브라우저 창이 뜨는 **로컬(데스크톱) 환경**에서 실행하세요(헤드리스/원격 불가).

## 사용 (Claude Code 안에서)

- `/write` — 곡 정보 + 사진 + 메모로 초안 생성 → 승인 → 임시저장
- `/learn-style` — 붙여넣은 기존 글로 스타일 학습 갱신
- `/analyze-trends` — 붙여넣은 자료로 트렌드 정리
- `/setup-login` — 로그인 세션 만들기

수동 실행:
```bash
node scripts/naver_draft.js drafts/<파일>.json --dry-run   # 저장 안 하고 흐름만(디버깅 우선)
node scripts/naver_draft.js drafts/<파일>.json             # 임시저장까지
node scripts/probe_selectors.js                            # 셀렉터 진단(읽기 전용)
node scripts/mosaic.js drafts/<spec>.json                  # 사진 모자이크
```

## 폴더 구조
```
CLAUDE.md            마스터 지침(글쓰기 공식·실측 셀렉터 지식·규칙) ← 단일 기준
.claude/commands/    /write /learn-style /analyze-trends /setup-login
data/                profile · blogger-profile · style-profile · song-checklist 등 지식
scripts/             naver_login · naver_draft · mosaic · probe_selectors (+ lib/)
input/photos/        원본 사진 (→ _mosaic/ 처리본), input/videos/ (당분 미사용)
drafts/              초안 JSON · 텍스트 덤프 · 스크린샷 · 모자이크 spec
naver-profile/       로그인 세션(gitignore, 공유 금지)
```

## 첫 실행 시 알아둘 것 (셀렉터 미검증 항목)
네이버 스마트에디터는 UI가 자주 바뀝니다. 아래는 **첫 `/write`에서 `probe`로 실측 후 확정**이 필요합니다:
- **유튜브 임베드** 경로(동영상/링크 툴바)
- **이미지 업로드** 버튼
- **소제목 서식 드롭다운·글자 크기(fs19)** 옵션

실패 시 `node scripts/probe_selectors.js`로 실제 DOM을 떠서 `scripts/lib/editor.js`의 `SEL`과 `CLAUDE.md §8`을 고치고, 안정본은 `*.working.js`로 백업하세요. 3회 실패하면 수동 붙여넣기용 원고를 출력합니다.

## 주의
- 브라우저 자동화는 네이버 약관상 **회색지대**입니다. 본인 계정, **하루 1~2건** 권장.
- 발행 후 24시간 수정 금지, 주 2~3회 주기, 협찬 표기 육안 확인.
- 디버깅 중 "저장 글"에 쌓인 실패본은 **직접** 정리하세요(자동 삭제 안 함). `--dry-run`을 우선 사용하면 덜 쌓입니다.
