/* =========================
   Entre Alas y Raíces - script.js
   ========================= */

// Nav activa por URL
(function highlightActiveNav(){
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(a=>{
    const href = a.getAttribute('href');
    if((!href && path==='index.html') || href === path){ a.classList.add('active'); }
  });
})();

// ======= Carrito simple (localStorage) =======
const CART_KEY = 'ear_cart_v1';

function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(items){ localStorage.setItem(CART_KEY, JSON.stringify(items)); }

function addToCart(product){
  const cart = getCart();
  const idx = cart.findIndex(p=>p.id===product.id);
  if(idx>-1){ cart[idx].qty += product.qty || 1; }
  else { cart.push({...product, qty: product.qty || 1}); }
  saveCart(cart);
  alert('Producto agregado al carrito.');
  updateCartBadge();
}
function removeFromCart(id){
  const cart = getCart().filter(p=>p.id!==id);
  saveCart(cart);
  renderCart();
  updateCartBadge();
}
function updateQty(id, qty){
  const cart = getCart().map(p => p.id===id ? {...p, qty: Math.max(1, qty)} : p);
  saveCart(cart);
  renderCart();
  updateCartBadge();
}
function cartTotal(){
  return getCart().reduce((acc,p)=> acc + (p.price*p.qty), 0);
}
function updateCartBadge(){
  const sum = getCart().reduce((n,p)=>n+p.qty,0);
  const badge = document.querySelector('[data-cart-badge]');
  if(badge){ badge.textContent = sum>0 ? String(sum) : ''; }
}
document.addEventListener('DOMContentLoaded', updateCartBadge);

// Render de carrito (carrito.html)
function renderCart(){
  const table = document.getElementById('cart-table-body');
  const totalEl = document.getElementById('cart-total');
  if(!table || !totalEl) return;
  const cart = getCart();
  table.innerHTML = '';
  cart.forEach(p=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.name}</strong><br><small>${p.desc||''}</small></td>
      <td>$${p.price.toLocaleString('es-CL')}</td>
      <td>
        <input type="number" min="1" value="${p.qty}" style="width:80px"
               onchange="updateQty('${p.id}', parseInt(this.value,10))">
      </td>
      <td>$${(p.price*p.qty).toLocaleString('es-CL')}</td>
      <td><button class="btn btn-outline" onclick="removeFromCart('${p.id}')">Eliminar</button></td>
    `;
    table.appendChild(tr);
  });
  totalEl.textContent = '$' + cartTotal().toLocaleString('es-CL');
}
document.addEventListener('DOMContentLoaded', renderCart);

// Pago externo (ej. Mercado Pago) – link placeholder para editar
function goToPayment(){
  if(getCart().length===0){ alert('Tu carrito está vacío.'); return; }
  // Aquí puedes reemplazar por tu preferencia de checkout externo.
  // Ejemplo: URL de preferencia de Mercado Pago una vez creada:
  // location.href = 'https://www.mercadopago.cl/checkout/v1/redirect?preference-id=XXXX';
  location.href = 'https://www.mercadopago.cl/';
}
