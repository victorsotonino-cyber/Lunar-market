// Simple client-side admin panel prototype
// Guarda datos en localStorage para persistencia local

const SELECTORS = {
  navBtns: document.querySelectorAll('.nav-btn'),
  views: {
    dashboard: document.getElementById('dashboardView'),
    categories: document.getElementById('categoriesView'),
    products: document.getElementById('productsView'),
    settings: document.getElementById('settingsView')
  },
  viewTitle: document.getElementById('viewTitle'),
  categoryForm: document.getElementById('categoryForm'),
  catName: document.getElementById('catName'),
  catDesc: document.getElementById('catDesc'),
  categoriesList: document.getElementById('categoriesList'),
  prodForm: document.getElementById('productForm'),
  prodName: document.getElementById('prodName'),
  prodCategory: document.getElementById('prodCategory'),
  prodPrice: document.getElementById('prodPrice'),
  prodDesc: document.getElementById('prodDesc'),
  prodImage: document.getElementById('prodImage'),
  imgPreview: document.getElementById('imgPreview'),
  productsList: document.getElementById('productsList'),
  latestProducts: document.getElementById('latestProducts'),
  countCategories: document.getElementById('countCategories'),
  countProducts: document.getElementById('countProducts'),
  resetBtn: document.getElementById('resetBtn'),
  search: document.getElementById('search')
}

let state = {
  categories: [],
  products: []
}

function save() {
  localStorage.setItem('panelData', JSON.stringify(state));
}

function load() {
  const raw = localStorage.getItem('panelData');
  if (raw) {
    try {
      state = JSON.parse(raw);
    } catch(e) { state = {categories:[],products:[]} }
  }
}

// Rendering
function renderCategories() {
  SELECTORS.categoriesList.innerHTML = '';
  SELECTORS.prodCategory.innerHTML = '<option value="">Selecciona una categoría</option>';

  state.categories.forEach((c, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<div style="flex:1">
      <strong>${escapeHtml(c.name)}</strong>
      <div style="font-size:12px;color:var(--muted)">${escapeHtml(c.desc||'')}</div>
    </div>
    <div style="text-align:right">
      <button data-index="${i}" class="del-cat btn warn">Eliminar</button>
    </div>`;
    SELECTORS.categoriesList.appendChild(li);

    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    SELECTORS.prodCategory.appendChild(opt);
  });

  SELECTORS.countCategories.textContent = state.categories.length;
}

function renderProducts(filter = '') {
  SELECTORS.productsList.innerHTML = '';
  SELECTORS.latestProducts.innerHTML = '';
  const list = state.products.filter(p => (p.name + p.desc + p.categoryName).toLowerCase().includes(filter.toLowerCase()));

  list.forEach((p, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${p.image||''}" class="img-preview ${p.image?'':'hidden'}" alt="img" />
      <div style="flex:1">
        <strong>${escapeHtml(p.name)}</strong>
        <div style="font-size:12px;color:var(--muted)">${escapeHtml(p.categoryName)} • $${Number(p.price).toFixed(2)}</div>
      </div>
      <div style="text-align:right">
        <button data-index="${i}" class="del-prod btn warn">Eliminar</button>
      </div>`;
    SELECTORS.productsList.appendChild(li);

    // latest
    const li2 = document.createElement('li'); li2.textContent = `${p.name} — ${p.categoryName}`; SELECTORS.latestProducts.appendChild(li2);
  });

  SELECTORS.countProducts.textContent = state.products.length;
}

// Helpers
function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>\"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]) }

function uid(prefix='id'){ return prefix + '_' + Math.random().toString(36).slice(2,9) }

// Events
SELECTORS.categoryForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = SELECTORS.catName.value.trim();
  if(!name){ alert('El nombre es obligatorio'); return; }
  const cat = { id: uid('cat'), name, desc: SELECTORS.catDesc.value.trim() };
  state.categories.push(cat);
  save();
  renderCategories();
  SELECTORS.categoryForm.reset();
});

SELECTORS.productForm.addEventListener('submit', e=>{
  e.preventDefault();
  const name = SELECTORS.prodName.value.trim();
  const catId = SELECTORS.prodCategory.value;
  const price = SELECTORS.prodPrice.value;
  if(!name || !catId || price === '') { alert('Completa nombre, categoría y precio'); return; }
  const cat = state.categories.find(c => c.id === catId);
  if(!cat){ alert('Categoría inválida'); return; }
  const readerImage = SELECTORS.imgPreview.src || '';
  const prod = {
    id: uid('prod'),
    name,
    price: Number(price),
    desc: SELECTORS.prodDesc.value.trim(),
    categoryId: catId,
    categoryName: cat.name,
    image: readerImage
  };
  state.products.unshift(prod); // newest first
  save();
  renderProducts(SELECTORS.search.value || '');
  SELECTORS.productForm.reset();
  SELECTORS.imgPreview.src = '';
  SELECTORS.imgPreview.classList.add('hidden');
});

SELECTORS.prodImage.addEventListener('change', e=>{
  const f = e.target.files?.[0];
  if(!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    SELECTORS.imgPreview.src = reader.result;
    SELECTORS.imgPreview.classList.remove('hidden');
  };
  reader.readAsDataURL(f);
});

// Delegated delete handlers
document.addEventListener('click', e=>{
  if(e.target.matches('.del-cat')){
    const idx = Number(e.target.dataset.index);
    const cat = state.categories[idx];
    // check products using category
    const used = state.products.some(p => p.categoryId === cat.id);
    if(used && !confirm('Hay productos en esta categoría. Eliminarla los dejará sin categoría. ¿Eliminar?')) return;
    state.categories.splice(idx,1);
    // Option: remove category on products
    state.products = state.products.map(p=> p.categoryId===cat.id ? {...p, categoryId:'', categoryName:'(sin categoría)'} : p );
    save();
    renderCategories();
    renderProducts(SELECTORS.search.value || '');
  }
  if(e.target.matches('.del-prod')){
    const idx = Number(e.target.dataset.index);
    if(!confirm('Eliminar producto?')) return;
    state.products.splice(idx,1);
    save();
    renderProducts(SELECTORS.search.value || '');
  }
});

// Nav
SELECTORS.navBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.view;
    Object.keys(SELECTORS.views).forEach(k=>{
      SELECTORS.views[k].classList.toggle('hidden', k !== view);
    });
    SELECTORS.viewTitle.textContent = btn.textContent;
  });
});

// Reset
SELECTORS.resetBtn.addEventListener('click', ()=>{
  if(confirm('Borrar todos los datos?')) {
    state = {categories:[], products:[]};
    save();
    renderCategories();
    renderProducts();
  }
});

// Search
SELECTORS.search.addEventListener('input', (e)=>{
  renderProducts(e.target.value);
});

// Init
function init(){
  load();
  // ensure categories have ids if older format
  state.categories = state.categories || [];
  state.products = state.products || [];
  renderCategories();
  renderProducts();
}
init();
