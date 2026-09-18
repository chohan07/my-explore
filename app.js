let galleryData = [];

// 기본 gallery.csv 자동 불러오기
window.addEventListener('DOMContentLoaded', () => {
  fetch('gallery.csv')
    .then(res => res.text())
    .then(csvText => {
      parseCSV(csvText);
    })
    .catch(() => {
      console.warn("gallery.csv 불러오기 실패. 기본 테스트 데이터 세팅.");
    });
});

// CSV 파싱 엔진
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return;

  const headers = lines[0].split(',').map(h => h.trim());
  galleryData = lines.slice(1).map(line => {
    // 큰따옴표 안 컴마 예외 처리 정규식
    const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
    const item = {};
    headers.forEach((header, index) => {
      let val = values[index] ? values[index].trim() : '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1);
      }
      item[header] = val;
    });
    return item;
  });

  renderGallery(galleryData);
}

// 외부 CSV 로드 함수
function loadExternalCSV(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    parseCSV(e.target.result);
  };
  reader.readAsText(file);
}

// 갤러리 그리드 렌더링
function renderGallery(items) {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';

  items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => openModal(item);

    card.innerHTML = `
      <img src="${item.image}" alt="${item.title}" loading="lazy">
      <div class="card-overlay">
        <div class="card-title">${item.title || 'Untitled'}</div>
        <div class="card-prompt">${item.prompt || ''}</div>
        <div class="card-meta">
          <span>by ${item.author || 'Anonymous'}</span>
          <button class="like-btn" onclick="event.stopPropagation(); addLike(${index}, this)">
            ❤️ ${item.likes || 0}
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// 실시간 검색
function handleSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = galleryData.filter(item => 
    (item.title && item.title.toLowerCase().includes(query)) ||
    (item.prompt && item.prompt.toLowerCase().includes(query)) ||
    (item.tags && item.tags.toLowerCase().includes(query))
  );
  renderGallery(filtered);
}

// 메뉴 열고 접기 토글
function toggleMenu(element) {
  const group = element.parentElement;
  group.classList.toggle('open');
}

// 하위 에피소드 선택 시 필터링
function filterBySub(epKey, evt) {
  // 클릭된 항목 활성화 스타일 지정
  document.querySelectorAll('.sub-item').forEach(el => el.classList.remove('active'));
  if (evt && evt.target) {
    evt.target.classList.add('active');
  }

  if (epKey === 'All') {
    renderGallery(galleryData);
  } else {
    // CSV 데이터 중 category, tags, title에 EP 키워드가 들어있는 항목 필터링
    const filtered = galleryData.filter(item => 
      (item.category && item.category.includes(epKey)) ||
      (item.tags && item.tags.includes(epKey)) ||
      (item.title && item.title.includes(epKey))
    );
    renderGallery(filtered);
  }
}

// 좋아요 기능
function addLike(index, btn) {
  let likes = parseInt(galleryData[index].likes || 0);
  likes++;
  galleryData[index].likes = likes;
  btn.innerHTML = `❤️ ${likes}`;
}

// 상세보기 모달
function openModal(item) {
  document.getElementById('modalImg').src = item.image;
  document.getElementById('modalTitle').innerText = item.title || 'Untitled';
  document.getElementById('modalMeta').innerText = `Created by ${item.author || 'Me'} • ${item.date || ''}`;
  document.getElementById('modalPrompt').innerText = item.prompt || 'No prompt provided.';
  document.getElementById('modalTags').innerText = item.tags ? `Tags: ${item.tags}` : '';
  document.getElementById('imageModal').classList.add('active');
}

function closeModal() {
  document.getElementById('imageModal').classList.remove('active');
}

// 프롬프트 복사
function copyPrompt() {
  const text = document.getElementById('modalPrompt').innerText;
  navigator.clipboard.writeText(text).then(() => {
    alert('Prompt copied to clipboard!');
  });
}