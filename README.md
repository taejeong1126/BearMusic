<div align="center">
  <img 
    src="https://i.imgur.com/D1PiMzb.jpeg"
    alt="BearMusic 로고"
    width="200"
    style="border-radius: 24px;"
  />

  <h1>BearMusic V4</h1>

  <p>
    음원 추출, 가사 싱크, 비디오 렌더링 및<br/>
    유튜브 업로드 과정을 자동화하는 리릭 비디오 생성 애플리케이션
  </p>
</div>

---

## 🎬 데모 영상

### LUCY - 카멜레온 [Childish]ㅣ가사/Lyrics

[![LUCY - 카멜레온 [Childish]ㅣ가사/Lyrics](http://img.youtube.com/vi/pKFIynpF_pY/0.jpg)](https://www.youtube.com/watch?v=pKFIynpF_pY)

---

## 📦 이전 버전 다운로드

<details>
  <summary><strong>V1</strong></summary>

<br>

[⬇️ BearMusic V1 다운로드](https://github.com/taejeong1126/BearMusic/archive/4f29d95ff19a01a6a06588be38ed1152f89b3862.zip)

<br>

[![혼술하고 싶은 밤 - BEN](http://img.youtube.com/vi/FVJIJdDk430/0.jpg)](https://youtu.be/FVJIJdDk430?t=0s)

</details>

<details>
  <summary><strong>V2</strong></summary>

<br>

[⬇️ BearMusic V2 다운로드](https://github.com/taejeong1126/BearMusic/archive/b13edee083407cd28f423476e963cceffef28e41.zip)

<br>

[![Letter To Myself - TAEYEON](http://img.youtube.com/vi/oDjDPfo1i2w/0.jpg)](https://www.youtube.com/watch?v=oDjDPfo1i2w)

</details>

<details>
  <summary><strong>V3</strong></summary>

<br>

[⬇️ BearMusic V3 다운로드](https://github.com/taejeong1126/BearMusic/archive/a6bd3b44f9c7bb083e2e37f98a50e77e774bc95a.zip)

<br>

[![황가람 - 나는 반딧불](http://img.youtube.com/vi/hhk4NYiCgeo/0.jpg)](https://www.youtube.com/watch?v=hhk4NYiCgeo)

</details>

<br>

## 🚀 설치 방법

### 📋 필수 설치

- [Node.js](https://nodejs.org/) — v22 이상
- [Yarn](https://yarnpkg.com/) — v4
- [FFmpeg](https://ffmpeg.org/)
- [fpcalc (Chromaprint)](https://acoustid.org/chromaprint)

---

### 📥 저장소 복제

```sh
$ git clone https://github.com/taejeong1126/BearMusic.git
$ cd BearMusic
```

### 📦 의존성 설치

```sh
$ yarn install
```

### ⚙️ 환경 변수 설정

> 프로젝트 루트에 `.env` 파일을 생성한 뒤 아래 내용을 추가합니다.  
> `REFRESH_TOKEN` 은 `yarn run auth` 명령어를 통해 발급받을 수 있습니다.

```env
MONGO_URI=""

CHROME_PATH="/usr/bin/chromium-browser"

CLIENT_ID=""
CLIENT_SECRET=""
REFRESH_TOKEN=""
```

<details>
  <summary><strong>변수 설명</strong></summary>

<br>

- `MONGO_URI`  
  MongoDB 연결 URI

- `CHROME_PATH`  
  Chromium 또는 Google Chrome 실행 파일 경로

- `CLIENT_ID`  
  Google OAuth Client ID  
  유튜브 업로드 API 사용 시 필요

- `CLIENT_SECRET`  
  Google OAuth Client Secret  
  유튜브 업로드 API 사용 시 필요

- `REFRESH_TOKEN`  
  Google OAuth Refresh Token  
  유튜브 업로드 API 사용 시 필요

</details>

### ▶️ 애플리케이션 실행

#### 프로덕션 빌드

```sh
$ yarn build
```

#### 프로덕션 실행

```sh
$ yarn start
```

### 📬 대기열 등록

> 영상 생성은 [Bugs](https://music.bugs.co.kr/) 기반 대기열 시스템으로 작동합니다.

```sh
$ yarn run queue
```

## 🤝 피드백

프로젝트에 대한 **제안**, **버그 제보**, **개선 아이디어**는  
[GitHub Issues](https://github.com/taejeong1126/BearMusic/issues)에 남겨주세요.

## 📄 라이선스

[![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by-nc/4.0/)

이 프로젝트는 **CC BY-NC 4.0** 라이선스에 따라 배포됩니다.  
비상업적 목적에 한해 자유롭게 사용 및 수정할 수 있습니다.
