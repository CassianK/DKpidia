const state = { items: [], idx: null, tagset: new Set(), activeTags: new Set() };

async function load() {
  const res = await fetch('data/index.json');
  state.items = (await res.json()).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
  state.items.forEach(it => (it.tags||[]).forEach(t => state.tagset.add(t)));
  renderTags(); renderCards(state.items); buildIndex();
  wireSearch();
}
function renderTags() {
  const el = document.getElementById('tags'); el.innerHTML = '';
  [...state.tagset].sort().forEach(tag => {
    const span = document.createElement('span');
    span.className = 'tag'; span.textContent = '#'+tag;
    span.onclick = () => { 
      span.classList.toggle('active');
      state.activeTags.has(tag) ? state.activeTags.delete(tag) : state.activeTags.add(tag);
      filterAndRender();
    };
    el.appendChild(span);
  });
}
function cardHTML(it){
  const url = `library/${it.category}/${it.id}.html`;
  const tags = (it.tags||[]).map(t=>`<span class="tag">#${t}</span>`).join(' ');
  return `<article class="card">
    <h3><a href="${url}">${it.title}</a></h3>
    <div class="meta">${it.category} · ${it.date||''} · ${it.authors?.join(', ')||''}</div>
    <p>${it.summary||''}</p>
    <div>${tags}</div>
  </article>`;
}
function renderCards(list){
  document.getElementById('cards').innerHTML = list.map(cardHTML).join('');
}
function buildIndex(){
  state.idx = lunr(function(){
    this.ref('id');
    this.field('title'); this.field('summary'); this.field('category'); this.field('tags');
    state.items.forEach(doc => this.add({
      id: doc.id, title: doc.title, summary: doc.summary,
      category: doc.category, tags: (doc.tags||[]).join(' ')
    }));
  });
}
function wireSearch(){
  const input = document.getElementById('search');
  input.addEventListener('input', () => filterAndRender(input.value.trim()));
}
function filterAndRender(q=''){
  let list = state.items;
  if (q.startsWith('#')) {
    const t = q.slice(1).toLowerCase();
    list = list.filter(it => (it.tags||[]).some(x => x.toLowerCase().includes(t)));
  } else if (q.length > 1 && state.idx) {
    const hits = state.idx.search(q).map(r => r.ref);
    const hitset = new Set(hits);
    list = list.filter(it => hitset.has(it.id));
  }
  if (state.activeTags.size) {
    list = list.filter(it => [...state.activeTags].every(t => (it.tags||[]).includes(t)));
  }
  renderCards(list);
}
load();
