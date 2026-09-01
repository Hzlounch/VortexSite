/* ==========================================================================
   VORTEX CLIENT — FEATURES LOADER
   Loads features sections published from Discord via /site-features and
   prepends them to the static feature sections. Falls back silently when
   nothing is published or the request fails.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main');
  if (!main) return;

  const sources = [
    'https://vortex-site-beta.vercel.app/content/site-content.json',
    'content/site-content.json'
  ];

  loadFrom(sources, 0);

  function loadFrom(list, index) {
    if (index >= list.length) return;
    fetch(list[index], { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then((data) => {
        const entries = Array.isArray(data && data.features) ? data.features : [];
        if (!entries.length) throw new Error('empty');
        entries.forEach((entry) => {
          const section = buildSection(entry);
          if (section) main.appendChild(section);
        });
      })
      .catch(() => loadFrom(list, index + 1));
  }
});

function buildSection(f) {
  if (!f || !f.title) return null;
  const section = document.createElement('section');
  section.className = 'feature-section wrap dynamic-feature';
  section.id = 'feature-' + (f.id || '').replace(/[^a-z0-9-]/gi, '');

  const imgWrap = document.createElement('div');
  imgWrap.className = 'feature-img';
  if (f.imageUrl && /^https?:\/\//i.test(f.imageUrl)) {
    const img = document.createElement('img');
    img.src = f.imageUrl;
    img.alt = f.title;
    img.loading = 'lazy';
    img.onerror = () => { imgWrap.remove(); };
    imgWrap.appendChild(img);
  } else {
    imgWrap.remove();
  }

  const text = document.createElement('div');
  text.className = 'feature-text';
  const tag = document.createElement('span');
  tag.className = 'feature-tag';
  tag.textContent = f.tag || 'Featured';
  const h2 = document.createElement('h2');
  h2.textContent = f.title;
  const p = document.createElement('p');
  p.textContent = f.description || '';
  text.appendChild(tag);
  text.appendChild(h2);
  text.appendChild(p);

  section.appendChild(imgWrap);
  section.appendChild(text);
  return section;
}