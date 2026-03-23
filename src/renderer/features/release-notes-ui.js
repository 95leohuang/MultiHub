import { releaseNotes } from './release-notes-data.js';

document.addEventListener('DOMContentLoaded', () => {
  const triggerBtn = document.getElementById('sidebar-logo');
  const modal = document.getElementById('release-notes-modal');
  const closeBtn = document.getElementById('close-release-notes');
  const timelineContainer = document.getElementById('release-notes-timeline');

  if (!triggerBtn || !modal || !closeBtn || !timelineContainer) return;

  function renderReleaseNotes() {
    timelineContainer.innerHTML = '';
    releaseNotes.forEach((note, index) => {
      const item = document.createElement('div');
      item.className = 'rn-timeline-item';
      // 添加延遲進場動畫class
      item.style.animationDelay = `${index * 0.1}s`;
      
      const header = document.createElement('div');
      header.className = 'rn-item-header';
      
      const versionBadge = document.createElement('span');
      versionBadge.className = 'rn-version-badge';
      versionBadge.textContent = 'v' + note.version;
      
      const dateText = document.createElement('span');
      dateText.className = 'rn-date-text';
      dateText.textContent = note.date;
      
      header.appendChild(versionBadge);
      header.appendChild(dateText);
      
      const content = document.createElement('div');
      content.className = 'rn-item-content';
      
      const title = document.createElement('h4');
      title.className = 'rn-title';
      title.textContent = note.title;
      content.appendChild(title);
      
      if (note.changes && note.changes.length > 0) {
        const changesList = document.createElement('ul');
        changesList.className = 'rn-changes-list';
        note.changes.forEach(change => {
          const li = document.createElement('li');
          const typeBadge = document.createElement('span');
          typeBadge.className = `rn-type-badge rn-type-${change.type}`;
          typeBadge.textContent = change.type.toUpperCase();
          
          li.appendChild(typeBadge);
          li.appendChild(document.createTextNode(' ' + change.text));
          changesList.appendChild(li);
        });
        content.appendChild(changesList);
      }
      
      item.appendChild(header);
      item.appendChild(content);
      timelineContainer.appendChild(item);
    });
  }

  function openModal() {
    renderReleaseNotes();
    modal.classList.remove('hidden');
    // small delay to trigger CSS transition properly
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        modal.classList.add('visible');
      });
    });
  }

  function closeModal() {
    modal.classList.remove('visible');
    setTimeout(() => {
      modal.classList.add('hidden');
    }, 300); // 配合 CSS transition 時長
  }

  triggerBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // 支援 ESC 鍵關閉
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('visible')) {
      closeModal();
    }
  });
});
