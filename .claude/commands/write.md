---
description: 곡 정보 + 사진 + 한줄 메모로 팝송 해석 글 초안을 만들고, 승인 후 네이버 임시저장까지 한다
---

# /write — 팝송 해석 글 초안 작성 → 승인 → 임시저장

먼저 `CLAUDE.md` 전체(특히 §1 절대규칙, §2 워크플로, §3 글쓰기 공식, §8 실측 지식)와
`data/blogger-profile.md`, `data/style-profile.md`, `data/profile.md`, `data/song-checklist.md`를 읽고 시작한다.

## 진행 순서 (CLAUDE.md §2 그대로)

1. **입력 확인**: `input/photos/`의 사진 목록, 사용자가 준 곡 정보와 한줄 메모.
2. **반드시 먼저 질문** (임의 판단 금지):
   - 협찬/체험단 여부 (메모에 없으면).
   - 곡 정보·가사 원문 등 확인 안 된 사실. **지어내지 않는다.**
   - 이번 글의 키워드 축(곡별 vs 큐레이션/학습) 확정.
3. **사진 열람(Read)** → 개인정보 발견 시 `scripts/mosaic.js` 파이프라인(CLAUDE.md §5). 처리본 확인 후 그 경로만 사용.
4. **곡 정보 체크리스트**(`data/song-checklist.md`) 항목별 대조. 빈 항목은 질문 또는 제외.
5. **글 작성 — `data/style-profile.md`의 Volador 8단 구조**를 1순위로. 인라인 영어 표현 노트 `(*표현 = 뜻·어원)` 3~6개 필수. SEO·가독성(§3)은 얹기만.
6. **협찬이면** `data/sponsored-disclosure.md` 문구를 상단 첫 text 블록에.
7. **초안 JSON 저장**: `drafts/<타임스탬프>-<곡slug>.json` (포맷 CLAUDE.md §4). 고정 꼬리말(저작권·CTA·"그럼 안녕~~")까지 블록으로 포함.
8. **자가 질문** 후 **초안을 사용자에게 보여주고 승인 요청.** (여기서 멈춘다.)
9. **승인 후에만**:
   ```bash
   node scripts/naver_draft.js drafts/<파일>.json          # 먼저 --dry-run 권장
   node scripts/naver_draft.js drafts/<파일>.json --dry-run
   ```
   → 자가 검증(CLAUDE.md §6: 스크린샷 + 텍스트 덤프 전문 대조) → "자동 처리 결과" + 발행 체크리스트(§7) 안내.

## 절대 하지 않는 것
- 발행(임시저장까지만). 발행 가드는 스크립트가 강제한다.
- 사실 지어내기. 확인 안 되면 질문.
- 승인 전 임시저장.
