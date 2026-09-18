# My Explore Gallery

Midjourney Explore와 비슷한 형태의 개인 AI 이미지 갤러리입니다.

## 가장 쉬운 사용법

1. `index.html`을 브라우저에서 엽니다.
2. `CSV 불러오기`를 눌러 CSV를 선택합니다.
3. CSV의 `image` 열에 적은 파일명과 같은 이미지 파일을 `이미지 추가`로 선택합니다.
4. Explore 화면에 Masonry 형태로 이미지가 표시됩니다.

## CSV 형식

필수 열:
- `image`: 이미지 파일명 또는 이미지 URL

선택 열:
- `title`
- `prompt`
- `category`
- `tags`
- `author`
- `date`
- `likes`

예:
`images/myimage01.jpg,Seoul Night,"cinematic Seoul at night",Photography,"Seoul,night",Me,2026-09-18,25`

## GitHub Pages로 공개할 때

프로젝트 폴더 안에 다음처럼 배치하면 됩니다.

project/
├─ index.html
├─ style.css
├─ app.js
├─ gallery.csv
└─ images/
   ├─ myimage01.jpg
   ├─ myimage02.jpg
   └─ ...

웹에서 CSV를 직접 자동 로딩하는 기능까지 원하면 app.js에서 `gallery.csv`를 fetch하도록 확장할 수 있습니다.
