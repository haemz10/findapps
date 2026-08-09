# findapps

작고 가벼운 웹앱 3종 모음 (모노레포). 각 앱은 의존성 없는 단일 `index.html`이라 브라우저로 파일을 열기만 하면 바로 실행됩니다.

## 앱 목록

| 앱 | 설명 | 폴더 |
|----|------|------|
| 🧺 **Cozy Collector** | Cluster Duck 스타일의 단순 수집 힐링 게임. 떨어지는 아이템(구슬·빈병·사과·파란 티셔츠·단추 등)을 모아 상자를 채우고, **재활용하기 / 판매하기**로 비우며 계속 모으기. 수집 도감 포함. | [`apps/cozy-collector`](apps/cozy-collector) |
| 🐨 **Sleepy Koala** | 수면 유도 앱. 호흡 가이드(4-1.5-6 리듬), 실시간 합성 앰비언트 사운드(비·파도·바람·모닥불), 슬립 타이머로 자동 종료 + 화면 디밍. | [`apps/sleepy-koala`](apps/sleepy-koala) |
| 😊 **Smile Coach** | 온디바이스 AI 셀카 미소 코치. 미소 세기·좌우 대칭·시선 고정을 실시간 게이지로 안내하고, 조건이 완벽할 때 자동 촬영. 모든 처리는 기기 내에서만 수행(전송 없음). | [`apps/smile-coach`](apps/smile-coach) |

## 실행 방법

각 폴더의 `index.html`을 브라우저에서 열면 됩니다.

- **Cozy Collector / Sleepy Koala**: 파일을 바로 열어도 동작합니다. (Sleepy Koala의 사운드는 사용자가 버튼을 누른 뒤 재생됩니다 — 브라우저 오디오 정책)
- **Smile Coach**: 카메라 권한이 필요하며 **HTTPS 또는 localhost**에서 실행해야 합니다. 로컬에서 볼 때:
  ```bash
  # 저장소 루트에서
  python3 -m http.server 8000
  # 브라우저에서 http://localhost:8000/apps/smile-coach/ 접속
  ```
  얼굴 인식 모델(MediaPipe Face Landmarker)은 최초 실행 시 CDN에서 내려받습니다(인터넷 필요). 이후 인식·판단·촬영은 모두 로컬에서 처리됩니다.

## 📱 안드로이드 앱 (Google Play 등재용)

세 웹앱은 [Capacitor](https://capacitorjs.com/)로 감싸 **서명된 AAB**로 빌드됩니다 → Play Console 업로드 가능.

- 패키징 프로젝트: [`mobile/`](mobile) (앱별 Capacitor + Android 프로젝트)
- 빌드/서명/등재 절차: [`mobile/README.md`](mobile/README.md)
- CI 자동 빌드: [`.github/workflows/android-build.yml`](.github/workflows/android-build.yml) — `apps/`·`mobile/` 변경 시 세 앱 AAB를 자동 빌드해 아티팩트로 업로드

| 앱 | 패키지명 | 특이 권한 |
|----|----------|-----------|
| Cozy Collector | `com.findapps.cozycollector` | — |
| Sleepy Koala | `com.findapps.sleepykoala` | — |
| Smile Coach | `com.findapps.smilecoach` | 카메라(온디바이스 처리, 전송 없음) |

## 저장소 구조에 대한 메모

세 앱을 **하나의 저장소 안 `apps/*` 폴더**로 관리하는 모노레포 방식입니다.
지금처럼 초기 프로토타입 단계에서는 관리·비교가 쉽고, 특정 앱이 커지면 그때 개별 저장소로 분리하는 편이 좋습니다.

## 기술

순수 HTML/CSS/JavaScript. 빌드 단계 없음. 상태 저장은 `localStorage`.
Smile Coach만 브라우저 표준 WebRTC(getUserMedia) + MediaPipe Tasks Vision(WASM)을 사용합니다.
