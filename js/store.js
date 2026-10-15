const products = window.NOVA_PRODUCTS;
const cart = new Map();
const grid = document.querySelector("#productGrid");
const searchInput = document.querySelector("#productSearch");
const cartDrawer = document.querySelector("#cartDrawer");
const cartBackdrop = document.querySelector("#cartBackdrop");
let activeFilter = "All";
let toastTimeout;

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const matchesCategory = activeFilter === "All" || product.category === activeFilter;
    const matchesSearch = `${product.name} ${product.category} ${product.detail}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  grid.innerHTML = filtered.map((product) => `
    <div class="col-6 col-lg-3">
      <article class="product-card">
        <div class="product-visual">
          <img src="https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=700&q=80" alt="${product.name} — ${product.detail}" loading="lazy">
          ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ""}
          <button class="favorite-button" type="button" aria-label="Add ${product.name} to favorites" aria-pressed="false"><i class="bi bi-heart"></i></button>
          <button class="add-button" type="button" data-add="${product.id}"><span>Add to bag</span><i class="bi bi-plus-lg"></i></button>
        </div>
        <div class="product-info">
          <span class="product-category">${product.category}</span>
          <div class="product-name-row"><h3 class="product-name">${product.name}</h3><span class="product-price">$${product.price.toFixed(2)}</span></div>
          <p class="product-description">${product.detail}</p>
        </div>
      </article>
    </div>
  `).join("");

  document.querySelector("#emptyState").classList.toggle("d-none", filtered.length > 0);
}

function openCart() {
  cartDrawer.classList.add("is-open");
  cartBackdrop.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-open");
  document.querySelector(".close-cart").focus();
}

function closeCart() {
  cartDrawer.classList.remove("is-open");
  cartBackdrop.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-open");
}

function updateCart() {
  const quantity = [...cart.values()].reduce((total, item) => total + item.quantity, 0);
  document.querySelector(".cart-count").textContent = quantity;
  document.querySelector("#cartHeadingCount").textContent = `(${quantity})`;
  document.querySelector("#cartItems").innerHTML = [...cart.values()].map(({ product, quantity: count }) => `
    <div class="cart-item">
      <img src="https://images.unsplash.com/${product.image}?auto=format&fit=crop&w=200&q=75" alt="">
      <div class="cart-item-info"><strong>${product.name}</strong><span>${product.detail}</span>
        <div class="quantity-control" aria-label="Quantity for ${product.name}">
          <button type="button" data-quantity="${product.id}" data-change="-1" aria-label="Remove one ${product.name}">−</button>
          <span>${count}</span>
          <button type="button" data-quantity="${product.id}" data-change="1" aria-label="Add one ${product.name}">+</button>
        </div>
      </div>
      <span class="cart-item-price">$${(product.price * count).toFixed(2)}</span>
    </div>
  `).join("");
  const isEmpty = quantity === 0;
  document.querySelector("#cartEmpty").classList.toggle("d-none", !isEmpty);
  document.querySelector("#cartFooter").classList.toggle("d-none", isEmpty);
  const subtotal = [...cart.values()].reduce((total, item) => total + item.product.price * item.quantity, 0);
  document.querySelector("#cartSubtotal").textContent = `$${subtotal.toFixed(2)}`;
}

function showToast(message) {
  const toast = document.querySelector("#toastMessage");
  toast.querySelector("span").textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

document.querySelectorAll(".filter-chip").forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip === button));
    renderProducts();
  });
});

document.querySelectorAll("[data-nav-category]").forEach((link) => {
  link.addEventListener("click", () => {
    activeFilter = link.dataset.navCategory;
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.toggle("active", chip.dataset.filter === activeFilter));
    renderProducts();
  });
});

searchInput.addEventListener("input", renderProducts);
document.querySelector(".search-toggle").addEventListener("click", () => {
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
  searchInput.focus({ preventScroll: true });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape") closeCart();
});

grid.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add]");
  if (addButton) {
    const product = products.find((item) => item.id === Number(addButton.dataset.add));
    const item = cart.get(product.id) || { product, quantity: 0 };
    item.quantity += 1;
    cart.set(product.id, item);
    updateCart();
    showToast(`${product.name} added to your bag`);
    return;
  }
  const favorite = event.target.closest(".favorite-button");
  if (favorite) {
    const isFavorite = favorite.getAttribute("aria-pressed") !== "true";
    favorite.setAttribute("aria-pressed", String(isFavorite));
    favorite.classList.toggle("is-favorite", isFavorite);
    favorite.innerHTML = `<i class="bi ${isFavorite ? "bi-heart-fill" : "bi-heart"}"></i>`;
    favorite.setAttribute("aria-label", `${isFavorite ? "Remove" : "Add"} ${favorite.closest(".product-card").querySelector(".product-name").textContent} ${isFavorite ? "from" : "to"} favorites`);
  }
});

document.querySelector("#cartItems").addEventListener("click", (event) => {
  const button = event.target.closest("[data-quantity]");
  if (!button) return;
  const id = Number(button.dataset.quantity);
  const item = cart.get(id);
  if (!item) return;
  item.quantity += Number(button.dataset.change);
  if (item.quantity <= 0) cart.delete(id);
  updateCart();
});

document.querySelector(".cart-toggle").addEventListener("click", openCart);
document.querySelector(".close-cart").addEventListener("click", closeCart);
cartBackdrop.addEventListener("click", closeCart);
document.querySelector(".continue-shopping").addEventListener("click", () => {
  closeCart();
  document.querySelector("#products").scrollIntoView({ behavior: "smooth" });
});
document.querySelector(".checkout-button").addEventListener("click", () => showToast("Checkout is coming soon — thanks for shopping Nova!"));

document.querySelector("#newsletterForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.querySelector("#emailAddress");
  if (!email.reportValidity()) return;
  document.querySelector("#newsletterMessage").textContent = "You're on the list. Look out for a little note from Nova!";
  email.value = "";
});

renderProducts();
updateCart();
