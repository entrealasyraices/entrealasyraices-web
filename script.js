/* =========================
   Entre Alas y Raíces - script.js
   ========================= */

// Nav activa por URL
(function highlightActiveNav() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.menu a').forEach(a => {
    const href = a.getAttribute('href');
    if ((!href && path === 'index.html') || href === path) {
      a.classList.add('active');
    }
  });
})();

// ======= Carrito simple (localStorage) =======
const CART_KEY = 'ear_cart_v1';

// Catálogo base para el carrito
const PRODUCTS = {
  'raices-fuertes': {
    id: 'raices-fuertes',
    name: 'Raíces Fuertes, Alas Conscientes',
    price: 44990
  },
  'pistas-crianza': {
    id: 'pistas-crianza',
    name: 'Pistas de Crianza',
    price: 34990
  },
  'entre-lineas': {
    id: 'entre-lineas',
    name: 'Entre Líneas',
    price: 17990
  },
  'ciclos-compartidos': {
    id: 'ciclos-compartidos',
    name: 'Ciclos Compartidos',
    price: 17990
  },
  'mi-carita-dice': {
    id: 'mi-carita-dice',
    name: 'Mi Carita Dice',
    price: 16990
  },
  'almas-en-colores': {
    id: 'almas-en-colores',
    name: 'Almas en Colores',
    price: 21990
  },
  'palabras-que-habitan': {
    id: 'palabras-que-habitan',
    name: 'Palabras que Habitan',
    price: 31990
  },
  'soy-presente': {
    id: 'soy-presente',
    name: 'Soy Presente',
    price: 34990
  },
  'ecos-que-sanan': {
    id: 'ecos-que-sanan',
    name: 'Ecos que Sanan',
    price: 29990
  }
};

// Helper para usar desde el HTML
function addProductToCart(id) {
  const product = PRODUCTS[id];
  if (!product) {
    console.error('Producto no encontrado en catálogo:', id);
    return;
  }
  addToCart(product);
}

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addToCart(product) {
  const cart = getCart();
  const idx = cart.findIndex(p => p.id === product.id);
  if (idx > -1) {
    cart[idx].qty += product.qty || 1;
  } else {
    cart.push({ ...product, qty: product.qty || 1 });
  }
  saveCart(cart);
  alert('Producto agregado al carrito.');
  updateCartBadge();
}

function removeFromCart(id) {
  const cart = getCart().filter(p => p.id !== id);
  saveCart(cart);
  renderCart();
  updateCartBadge();
}

function updateQty(id, qty) {
  const cart = getCart().map(p =>
    p.id === id ? { ...p, qty: Math.max(1, qty) } : p
  );
  saveCart(cart);
  renderCart();
  updateCartBadge();
}

function cartTotal() {
  return getCart().reduce((acc, p) => acc + (p.price * p.qty), 0);
}

function updateCartBadge() {
  const sum = getCart().reduce((n, p) => n + p.qty, 0);
  const badge = document.getElementById('cartBadge');
  if (!badge) return;

  if (sum > 0) {
    badge.textContent = sum;
    badge.style.display = 'inline-block';
  } else {
    badge.textContent = '';
    badge.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderCart();
});

// Render de carrito (carrito.html)
function renderCart() {
  const table = document.getElementById('cart-table-body');
  const totalEl = document.getElementById('cart-total');
  if (!table || !totalEl) return;

  const cart = getCart();
  table.innerHTML = '';

  cart.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${p.name}</strong><br><small>${p.desc || ''}</small></td>
      <td>$${p.price.toLocaleString('es-CL')}</td>
      <td>
        <input type="number" min="1" value="${p.qty}" style="width:80px"
               onchange="updateQty('${p.id}', parseInt(this.value, 10))">
      </td>
      <td>$${(p.price * p.qty).toLocaleString('es-CL')}</td>
      <td><button class="btn btn-outline" onclick="removeFromCart('${p.id}')">Eliminar</button></td>
    `;
    table.appendChild(tr);
  });

  totalEl.textContent = '$' + cartTotal().toLocaleString('es-CL');
}

// Pago externo – Getnet (placeholder)
function goToPayment() {
  if (getCart().length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }
  // Reemplazar cuando tengas tu link oficial de Getnet
  location.href = 'https://getnet.cl/link-provisorio';
}

/* =========================================
   AIDA – JS base (carrusel)
   ========================================= */

/* 1) Carrusel del Home (#homeCarousel) */
(function initHomeCarousel() {
  const root = document.getElementById('homeCarousel');
  if (!root) return; // si no estamos en el home, salir

  const track = root.querySelector('.carousel-track');
  const slides = Array.from(root.querySelectorAll('.carousel-slide'));
  const dotsWrap = root.querySelector('.carousel-dots');
  if (!track || slides.length === 0 || !dotsWrap) return;

  let index = 0, timer = null;

  // Crear dots
  slides.forEach((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('aria-label', 'Ir a imagen ' + (i + 1));
    if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => go(i, true));
    dotsWrap.appendChild(b);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('button'));

  function go(i, stopAuto) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(d => d.classList.remove('active'));
    if (dots[index]) dots[index].classList.add('active');
    if (stopAuto && timer) clearInterval(timer);
  }

  // Auto-play suave
  timer = setInterval(() => go(index + 1, false), 4500);

  // Accesibilidad: detener con visibilidad oculta de la pestaña
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && timer) clearInterval(timer);
    else timer = setInterval(() => go(index + 1, false), 4500);
  });
})();

/* (Opcional) Preparado para video en menú — desactivado
// document.getElementById('nav-video')?.addEventListener('click', (e) => {
//   e.preventDefault();
//   // Aquí abriríamos un modal e insertaríamos <iframe src="..."></iframe>
// });
*/

// === Menú hamburguesa (móvil) ===
const btnHamburguesa = document.querySelector('.hamburger');
const barraNavegacion = document.querySelector('.navbar.menu');

if (btnHamburguesa && barraNavegacion) {
  btnHamburguesa.addEventListener('click', () => {
    barraNavegacion.classList.toggle('is-open');
  });
}
