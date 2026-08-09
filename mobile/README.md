# findapps · Android 패키징 (Play Store 등재용)

세 개의 웹앱을 [Capacitor](https://capacitorjs.com/)로 감싼 안드로이드 앱입니다.
각 앱은 서명된 **AAB(Android App Bundle)** 로 빌드되어 Google Play Console에 바로 업로드할 수 있습니다.

## 앱 정보

| 앱 | 패키지명 (applicationId) | 권한 | 서명 alias |
|----|--------------------------|------|-----------|
| Cozy Collector | `com.findapps.cozycollector` | 인터넷 | `cozy` |
| Sleepy Koala | `com.findapps.sleepykoala` | 인터넷 | `koala` |
| Smile Coach | `com.findapps.smilecoach` | 인터넷, **카메라** | `smile` |

- 버전: `versionCode 1` / `versionName 1.0` (각 `mobile/<app>/android/app/build.gradle`에서 조정)
- 최소/타깃 SDK: Capacitor 기본값 (compile/target SDK 35)

## 로컬 빌드

사전 요구: JDK 21, Android SDK, Node 20+.

```bash
# 1) 웹 자산을 각 Capacitor 프로젝트로 복사
bash mobile/sync-web.sh

# 2) 특정 앱 빌드 (예: cozy-collector)
cd mobile/cozy-collector
npm install
npx cap sync android
cd android
./gradlew bundleRelease        # 릴리스 AAB (서명하려면 아래 keystore.properties 필요)
# 또는 테스트용 디버그 APK:
./gradlew assembleDebug
```

산출물:
- AAB: `mobile/<app>/android/app/build/outputs/bundle/release/app-release.aab`
- APK(디버그): `mobile/<app>/android/app/build/outputs/apk/debug/app-debug.apk`

## 서명 (릴리스)

릴리스 AAB에는 **업로드 키** 서명이 필요합니다. 키스토어와 비밀번호는 **저장소에 커밋하지 않습니다**(`.gitignore` 처리됨).

로컬에서 서명하려면 각 `mobile/<app>/android/keystore.properties` 파일을 만듭니다:

```properties
storeFile=/절대/경로/findapps-upload.keystore
storePassword=<비밀번호>
keyAlias=cozy        # 앱별 alias (cozy / koala / smile)
keyPassword=<비밀번호>
```

`keystore.properties`가 없으면 릴리스 빌드는 **미서명 AAB**를 만듭니다(디버그 빌드는 정상).

> 업로드 키스토어(`findapps-upload.keystore`)와 비밀번호는 별도로 안전하게 전달/보관하세요.
> 분실 시 Google Play 지원을 통해 업로드 키를 재설정해야 합니다.

## GitHub Actions 자동 빌드

`.github/workflows/android-build.yml` 가 `apps/` 또는 `mobile/` 변경 시(또는 수동 실행 시)
세 앱의 AAB를 자동 빌드하여 **Actions 아티팩트**로 올립니다.

CI에서 서명하려면 저장소 Secrets를 추가하세요
(Settings → Secrets and variables → Actions):

| Secret | 값 |
|--------|-----|
| `RELEASE_KEYSTORE_BASE64` | `base64 -w0 findapps-upload.keystore` 결과 문자열 |
| `RELEASE_STORE_PASSWORD` | 키스토어 비밀번호 |
| `RELEASE_KEY_PASSWORD` | 키 비밀번호(동일) |

Secret이 없으면 CI는 미서명 AAB를 산출합니다.

## Google Play Console 등재 절차 (사용자 진행)

1. [Play Console](https://play.google.com/console)에서 개발자 계정 등록(최초 1회, 등록비 $25).
2. **앱 만들기** → 앱 이름/기본 언어/무료·유료 선택.
3. **Play App Signing**을 사용(권장). 위 업로드 키로 서명한 AAB를 올리면 Google이 최종 서명을 관리합니다.
4. **프로덕션(또는 내부 테스트) 트랙**에 `app-release.aab` 업로드.
5. 스토어 등록정보 작성:
   - 앱 아이콘 512×512 PNG (아래 스토어 자산 참고)
   - 피처 그래픽 1024×500
   - 스크린샷 최소 2장 (폰: 최소 320px, 최대 3840px)
   - 짧은 설명(80자) / 자세한 설명(4000자)
6. **콘텐츠 등급 설문**, **데이터 보안(안전성) 양식**, **타깃 연령**, **개인정보처리방침 URL** 작성.
   - Smile Coach는 카메라를 사용하지만 **모든 처리가 온디바이스이며 이미지/영상을 전송·저장하지 않음**을 데이터 보안 양식에 명시하세요.
7. 검토 제출 → 승인 후 게시.

### 스토어 자산 힌트
- 512×512 아이콘 원본은 `mobile/<app>/assets/icon-only.png`(1024×1024)를 512로 리사이즈해 사용.
- 스크린샷은 앱 실행 화면을 캡처(폴더 `/screenshots` 참고 또는 직접 촬영).
