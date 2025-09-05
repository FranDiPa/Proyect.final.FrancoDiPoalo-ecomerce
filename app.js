// - Librería externa: SweetAlert2 para UI de mensajes
// - Persistencia: localStorage (carrito)
// - Lógica de negocio: stock, totales, checkout

dayjs.locale('es'); // Localización a español

const state = { //
  products: [], // Cargados desde JSON, aparecerian aca
  filtered: [], //busqueda/filtro
  cart: JSON.parse(localStorage.getItem('cart') || '[]'), //carrito-lee desde localStorage,si no hay nada en el carrito es un array vacio
  coupon: null, //cupón aplicado
  categories: new Set() //guarda categorias unicas( Motor,frenos,etc)
};

//cupones de descuento
const COUPONS = {
  'ALEMAN10': { type: 'percent', value: 10, min: 20000 },//10%- si la compra es mayor a 20000  (percent es porcentaje)
  'FREESHIP': { type: 'shipping', value: 3500, min: 15000 }//3500 pesos de descuento en envio, si la compra es mayor a 15000 (shipping es descuento fijo)
};


// Funciones extras/atajos
const $ = (selector) => document.querySelector(selector);  //selector
const $$ = (selector) => Array.from(document.querySelectorAll(selector));//selector multiple con array foreach
const money = (number) => number.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });//formatear numero a moneda argentina ej: 1000 a $1.000,00

// Guardar carrito en localStorage y actualizar contador
function saveCart(){
  localStorage.setItem('cart', JSON.stringify(state.cart));//guardar carrito en localStorage y convertir a string con JSON.stringify 
  $('#cartCount').textContent = state.cart.reduce((acumulador,i)=>acumulador+i.qty,0);//actualizar contador de carrito sumando las cantidades de cada item poniendo texto dentro del elemento
}

// Render products
function renderProducts(list){
  const grid = $('#productsGrid'); //busca el contenedor del grid de productos
  if (!list.length){// comprueba si la lista esta vacia
    grid.innerHTML = `<div class="empty">No hay resultados para tu búsqueda/filtrado.</div>`;
    return;
  }
  grid.innerHTML = list.map(p =>`
    <article class="card" data-id="${p.id}">
      <div class="card-img">🔧</div>
      <div class="card-body">
      <img src="${p.img}" alt="${p.name}"/>
        <h3>${p.name}</h3>
        <div class="muted">Código: ${p.sku} · ${p.category}</div>
        <div class="muted">Compatibilidad: ${p.compat.join(', ')}</div>
        <div class="price">${money(p.price)}</div>
        <div class="qty">
          <button class="icon-btn" data-action="dec" aria-label="disminuir">–</button>
          <input type="number" min="1" max="${p.stock}" value="1"/> 
          <button class="icon-btn" data-action="inc" aria-label="aumentar">+</button>
          <button class="btn-primary add-btn">Agregar</button>
        </div>
        <small class="muted">${p.stock} en stock</small>
      </div>
    </article>
  `).join('');//estructura de card de producto, max="${p.stock}" para que no se pueda pedir mas del stock disponible
}

// Render cart
function renderCart(){
  const wrap = $('#cartItems');//contenedor de items del carrito
  if (!state.cart.length){
    wrap.innerHTML = `<div class="empty">Tu carrito está vacío.</div>`;
  } else {
    wrap.innerHTML = state.cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div>
          <strong>${item.name}</strong>
          <div class="muted">Código ${item.sku}</div>
        </div>
        <div>${money(item.price)}</div>
        <div class="qty">
          <button class="icon-btn" data-action="minus">–</button>
          <input type="number" min="1" max="${item.stock}" value="${item.qty}"/>
          <button class="icon-btn" data-action="plus">+</button>
        </div>
        <button class="icon-btn" data-action="remove" title="Eliminar">🗑</button>
      </div>
    `).join('');//estructura de cada item en el carrito
  }
  updateTotals();
}

function updateTotals(){//calcula totales del carrito
  const sub = state.cart.reduce((a,i)=>a + i.price * i.qty, 0);
  let discount = 0;
  if (state.coupon){
    const c = COUPONS[state.coupon];
    if (c){
      if (c.type === 'percent' && sub >= c.min) discount = sub * (c.value/100);
      if (c.type === 'shipping' && sub >= c.min) discount = c.value;
    }
  }
  const total = Math.max(0, sub - discount);
  $('#subTotal').textContent = money(sub);
  $('#discount').textContent = discount ? `– ${money(discount)}` : money(0);
  $('#grandTotal').textContent = money(total);
}

// Filters & sort
function applyFilters(){//aplica busqueda, filtro y ordenamiento
  const q = $('#searchInput').value.trim().toLowerCase();
  const cat = $('#categoryFilter').value;
  let list = [...state.products];

  if (q){
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (cat !== 'todas'){
    list = list.filter(p => p.category === cat);
  }

  const sort = $('#sortSelect').value;//opcion de ordenamiento seleccionada
  if (sort === 'price_asc') list.sort((a,b)=>a.price-b.price);//ordenar array de productos por precio ascendente
  if (sort === 'price_desc') list.sort((a,b)=>b.price-a.price);//ordenar array de productos por precio descendente
  if (sort === 'name_asc') list.sort((a,b)=>a.name.localeCompare(b.name));//ordenar array de productos por nombre ascendente
  if (sort === 'name_desc') list.sort((a,b)=>b.name.localeCompare(a.name));//ordenar array de productos por nombre descendente

  state.filtered = list;
  renderProducts(list);
}

//carta open/close
function openDrawer(){//abrir carrito
  $('#cartDrawer').classList.add('open');
  $('#overlay').classList.add('show');
}
function closeDrawer(){//cerrar carrito
  $('#cartDrawer').classList.remove('open');
  $('#overlay').classList.remove('show');
}

// Eventos y lógica 
function wireEvents(){
  // Product qty controls & add
  $('#productsGrid').addEventListener('click', (e)=>{
    const card = e.target.closest('.card');
    if (!card) return;
    const id = card.dataset.id;
    const product = state.products.find(p => p.id == id);
    const input = card.querySelector('input[type="number"]');
    if (e.target.matches('[data-action="inc"]')){
      input.value = Math.min(product.stock, Number(input.value)+1);
    }
    if (e.target.matches('[data-action="dec"]')){
      input.value = Math.max(1, Number(input.value)-1);
    }
    if (e.target.classList.contains('add-btn')){
      const qty = Number(input.value);
      if (qty<1) return;
      const existing = state.cart.find(i=>i.id===product.id);
      const totalWanted = qty + (existing?.qty || 0);
      if (totalWanted > product.stock){
        Swal.fire({icon:'warning', title:'Stock insuficiente', text:`Stock disponible: ${product.stock}`});
        return;
      }
      if (existing){ existing.qty += qty; }
      else { state.cart.push({ id: product.id, name: product.name, sku: product.sku, price: product.price, qty, stock: product.stock }); }
      saveCart(); renderCart();
      Swal.fire({icon:'success', title:'Agregado al carrito', timer:1200, showConfirmButton:false});
    }
  });

  // Search / filter / sort
  $('#searchInput').addEventListener('input', applyFilters);//cada vez que se escribe en el input de busqueda se aplica el filtro
  $('#categoryFilter').addEventListener('change', applyFilters);  //cada vez que se cambia la categoria se aplica el filtro
  $('#sortSelect').addEventListener('change', applyFilters);//cada vez que se cambia el ordenamiento se aplica el filtro

  // Cart open/close
  $('#openCartBtn').addEventListener('click', ()=>{ renderCart(); openDrawer(); });//al abrir el carrito se renderizan los items
  $('#closeCartBtn').addEventListener('click', closeDrawer);//cerrar carrito
  $('#overlay').addEventListener('click', closeDrawer);//cerrar carrito al hacer click fuera del mismo

  // Carrt items - qty controls & remove
  $('#cartItems').addEventListener('click', (e)=>{
    const row = e.target.closest('.cart-item');
    if (!row) return;
    const id = row.dataset.id;
    const item = state.cart.find(i=>i.id == id);
    const input = row.querySelector('input[type="number"]');
    if (e.target.matches('[data-action="minus"]')){
      input.value = Math.max(1, Number(input.value)-1);
      item.qty = Number(input.value);
    }
    if (e.target.matches('[data-action="plus"]')){
      input.value = Math.min(item.stock, Number(input.value)+1);
      item.qty = Number(input.value);
    }
    if (e.target.matches('[data-action="remove"]')){
      const idx = state.cart.findIndex(i=>i.id==id);
      state.cart.splice(idx,1);
      row.remove();
    }
    saveCart(); updateTotals();
  });

  // Qty manual edit
  $('#cartItems').addEventListener('change', (e)=>{//cuando se cambia el valor del input de cantidad manualmente
    if (e.target.matches('input[type="number"]')){//si el objetivo del evento es un input de tipo numero
      const row = e.target.closest('.cart-item');
      const id = row.dataset.id;
      const item = state.cart.find(i=>i.id == id);
      item.qty = Math.max(1, Math.min(item.stock, Number(e.target.value)));
      e.target.value = item.qty;
      saveCart(); updateTotals();
    }
  });

  // Coupon
  $('#applyCouponBtn').addEventListener('click', ()=>{//al hacer click en aplicar cupon
    const code = $('#couponInput').value.trim().toUpperCase();
    if (!COUPONS[code]){
      Swal.fire({icon:'error', title:'Cupón inválido'}); return;
    }
    state.coupon = code; updateTotals();
    Swal.fire({icon:'success', title:'Cupón aplicado', text:`${code}`});
  });

  // Checkout
  $('#checkoutBtn').addEventListener('click', ()=>{
    if (!state.cart.length){
      Swal.fire({icon:'info', title:'Carrito vacío'}); return;
    }
    document.getElementById('checkoutModal').showModal();
  });
  $('#cancelCheckoutBtn').addEventListener('click', ()=>{
    document.getElementById('checkoutModal').close();
  });

  $('#checkoutForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());

    // Validaciones simples
    if (!data.fullName || !data.email){ 
      Swal.fire({icon:'error', title:'Completá tus datos'}); 
      return;
    }

    // Simulamos pago/orden
    const orderId = 'ORD-' + Math.random().toString(36).slice(2,8).toUpperCase();
    const date = dayjs().format('DD/MM/YYYY HH:mm');

    Swal.fire({
      icon:'success',
      title:'¡Compra confirmada!',
      html:`
        <p>Orden <strong>${orderId}</strong> — ${date}</p>
        <p>Total: <strong>${$('#grandTotal').textContent}</strong></p>
        <p>Enviaremos confirmación a <strong>${data.email}</strong></p>
      `
    });

    // Vaciar carrito y cerrar
    state.cart = [];
    saveCart();
    renderCart();
    document.getElementById('checkoutModal').close();
    closeDrawer();
  });
}

// Init - Carga productos y categorías
async function init(){
  try {
    const res = await fetch('data/products.json');
    const products = await res.json();
    state.products = products;
    products.forEach(p=>state.categories.add(p.category));
    // Build category filter
    const sel = $('#categoryFilter');
    sel.innerHTML = `<option value="todas">Todas las categorías</option>` + 
      [...state.categories].map(c=>`<option value="${c}">${c}</option>`).join('');
    applyFilters();
    saveCart();
    wireEvents();
  } catch (err){
    console.error(err);
    Swal.fire({icon:'error', title:'Error cargando datos', text:'Asegurate de servir el proyecto con un servidor local (Live Server).'});
  }
}

init();//iniciar la app
