const PRICE_STORAGE_KEY = "zahra_farmasi_prices_v1";
const SAVED_STORAGE_KEY = "zahra_farmasi_saved_offers_v1";
const BAG_STORAGE_KEY = "zahra_farmasi_bag_v1";
const ORDER_WHATSAPP_NUMBER = "9613984665";

const OFFER_PRODUCTS = [
  {
    code: "PK65038",
    name: "5'li Nutriplus Çıtır Kurabiye Aromalı Kilo Verme Amaçlı Enerjisi Kısıtlanmış Gıda Sachet",
    category: "Nutriplus",
    categories: ["Offers", "Nutriplus"],
    price: 295,
    regularPrice: null,
    image: "https://content-tr.farmasi.com.tr/Product/PK65038_250_1.webp",
    url: "https://www.farmasi.com.tr/zahraahjazi/product-list/f%C4%B1rsatlar?cid=52fd8666-b087-ee11-83bb-000d3a71539d",
    description: "A five-piece Nutriplus cookie-flavoured bundle from the Farmasi offers collection."
  },
  {
    code: "PK80003",
    name: "Farmasi Yaz Çantası & 3 Adet Dr. C. Tuna Sun Serisi Yüz Kremi",
    category: "Dr. C. Tuna",
    categories: ["Offers", "Dr. C. Tuna"],
    price: 1405.33,
    regularPrice: 1827,
    image: "https://content-tr.farmasi.com.tr/Product/PK80003_250_1.webp",
    url: "https://www.farmasi.com.tr/zahraahjazi/product-list/f%C4%B1rsatlar?cid=52fd8666-b087-ee11-83bb-000d3a71539d",
    description: "A Farmasi summer bag bundled with three Dr. C. Tuna Sun Series face creams."
  },
  {
    code: "PK80004",
    name: "Farmasi Yaz Çantası & 2 Adet Dr. C. Tuna Sun Serisi Vücut Losyonu",
    category: "Dr. C. Tuna",
    categories: ["Offers", "Dr. C. Tuna"],
    price: 1321.49,
    regularPrice: 1718,
    image: "https://content-tr.farmasi.com.tr/Product/PK80004_250_1.webp",
    url: "https://www.farmasi.com.tr/zahraahjazi/product-list/f%C4%B1rsatlar?cid=52fd8666-b087-ee11-83bb-000d3a71539d",
    description: "A Farmasi summer bag bundled with two Dr. C. Tuna Sun Series body lotions."
  },
  {
    code: "PK65037",
    name: "5'li Nutriplus Krem Karamel Aromalı Kilo Verme Amaçlı Enerjisi Kısıtlanmış Gıda Sachet",
    category: "Nutriplus",
    categories: ["Offers", "Nutriplus"],
    price: 295,
    regularPrice: null,
    image: "https://content-tr.farmasi.com.tr/Product/PK65037_250_1.webp",
    url: "https://www.farmasi.com.tr/zahraahjazi/product-list/f%C4%B1rsatlar?cid=52fd8666-b087-ee11-83bb-000d3a71539d",
    description: "A five-piece Nutriplus cream-caramel bundle from the Farmasi offers collection."
  }
];

if (
  !Array.isArray(window.FARMASI_PRODUCTS)
  || typeof window.FARMASI_CATALOG_DATE !== "string"
  || typeof window.FARMASI_FX_DATE !== "string"
  || !Number.isFinite(window.FARMASI_USD_PER_TRY)
  || window.FARMASI_USD_PER_TRY <= 0
) {
  throw new Error("Farmasi catalog data did not load.");
}

const catalogProductsByCode = new Map(window.FARMASI_PRODUCTS.map((product) => [product.code, product]));
const PRODUCTS = [
  ...OFFER_PRODUCTS.map((product) => ({
    ...product,
    nameEn: catalogProductsByCode.get(product.code)?.nameEn || product.name
  })),
  ...window.FARMASI_PRODUCTS.filter((product) => !OFFER_PRODUCTS.some((offer) => offer.code === product.code))
];
const CATEGORY_ORDER = [
  "Offers",
  "New Arrivals",
  "Makeup",
  "Skin Care",
  "Personal Care",
  "Hair Care",
  "Fragrance",
  "Men",
  "Nutriplus",
  "Mr. Wipes",
  "Gift Cards",
  "Accessories",
  "Dr. C. Tuna"
];
const PRICE_MARKUP_USD = 4;
const USD_PER_TRY = window.FARMASI_USD_PER_TRY;

const formatUSD = (amountInUSD) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2
}).format(amountInUSD);

function getProductPrice(amountInTRY) {
  return Math.round((amountInTRY * USD_PER_TRY + PRICE_MARKUP_USD) * 100) / 100;
}

let activeCategory = "all";
let savedProductCodes = loadSavedProducts();
let shoppingBag = loadShoppingBag();
const catalogDate = new Intl.DateTimeFormat("en", { dateStyle: "long" })
  .format(new Date(`${window.FARMASI_CATALOG_DATE}T00:00:00`));
const fxDate = new Intl.DateTimeFormat("en", { dateStyle: "long" })
  .format(new Date(`${window.FARMASI_FX_DATE}T00:00:00`));
let priceSnapshotDate = catalogDate;

const productGrid = document.getElementById("productGrid");
const resultsCount = document.getElementById("resultsCount");
const productSearch = document.getElementById("productSearch");
const sortProducts = document.getElementById("sortProducts");
const categoryFilters = document.getElementById("categoryFilters");
const priceUpdated = document.getElementById("priceUpdated");
const emptyState = document.getElementById("emptyState");
const bagCount = document.getElementById("bagCount");
const bagItems = document.getElementById("bagItems");
const bagEmpty = document.getElementById("bagEmpty");
const bagSummary = document.getElementById("bagSummary");
const bagTotal = document.getElementById("bagTotal");
const whatsappOrder = document.getElementById("whatsappOrder");
const bagStatus = document.getElementById("bagStatus");

function readStorage(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Could not read ${key} from local storage:`, error);
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Could not save ${key} to local storage:`, error);
    return false;
  }
}

function loadSavedProducts() {
  const saved = readStorage(SAVED_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) throw new TypeError("Saved products are not a list.");
    return [...new Set(parsed.filter((code) => PRODUCTS.some((product) => product.code === code)))];
  } catch (error) {
    console.error("Could not parse saved Farmasi products:", error);
    return [];
  }
}

function loadShoppingBag() {
  const saved = readStorage(BAG_STORAGE_KEY);
  if (!saved) return {};
  try {
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TypeError("Saved shopping bag is not a product list.");
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(([code, quantity]) =>
        PRODUCTS.some((product) => product.code === code)
        && Number.isInteger(quantity)
        && quantity > 0
        && quantity <= 99
      )
    );
  } catch (error) {
    console.error("Could not restore the Farmasi shopping bag:", error);
    return {};
  }
}

function saveShoppingBag() {
  const saved = writeStorage(BAG_STORAGE_KEY, JSON.stringify(shoppingBag));
  if (!saved) {
    bagStatus.textContent = "Your bag changed, but this browser could not save it for your next visit.";
  }
}

function loadStoredPrices() {
  const saved = readStorage(PRICE_STORAGE_KEY);
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    if (!data || !Array.isArray(data.products)) throw new TypeError("Saved prices are not a product list.");
    for (const savedProduct of data.products) {
      const product = PRODUCTS.find((entry) => entry.code === savedProduct.code);
      if (!product || !Number.isFinite(savedProduct.price) || savedProduct.price <= 0) continue;
      product.price = savedProduct.price;
      if (savedProduct.regularPrice === null || (Number.isFinite(savedProduct.regularPrice) && savedProduct.regularPrice >= savedProduct.price)) {
        product.regularPrice = savedProduct.regularPrice;
      }
    }
    if (typeof data.updatedAt === "string" && !Number.isNaN(Date.parse(data.updatedAt))) {
      priceSnapshotDate = new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(data.updatedAt));
    }
  } catch (error) {
    console.error("Could not restore saved Farmasi prices:", error);
  }
}

function normalizeText(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function renderProducts() {
  const query = normalizeText(productSearch.value);
  const filtered = PRODUCTS.filter((product) => {
    const categories = product.categories || [product.category];
    const matchesCategory = activeCategory === "all" || categories.includes(activeCategory);
    const matchesQuery = !query || normalizeText(`${product.nameEn || product.name} ${product.name} ${product.code} ${categories.join(" ")}`).includes(query);
    return matchesCategory && matchesQuery;
  });

  if (sortProducts.value === "price-low") filtered.sort((a, b) => getProductPrice(a.price) - getProductPrice(b.price));
  if (sortProducts.value === "price-high") filtered.sort((a, b) => getProductPrice(b.price) - getProductPrice(a.price));
  if (sortProducts.value === "name") filtered.sort((a, b) => a.name.localeCompare(b.name, "tr"));

  resultsCount.textContent = `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`;
  emptyState.hidden = filtered.length !== 0;
  productGrid.innerHTML = filtered.map(renderProduct).join("");
}

function renderCategoryFilters() {
  const availableCategories = new Set(PRODUCTS.flatMap((product) => product.categories || [product.category]));
  const orderedCategories = [
    ...CATEGORY_ORDER.filter((category) => availableCategories.has(category)),
    ...[...availableCategories].filter((category) => !CATEGORY_ORDER.includes(category)).sort((a, b) => a.localeCompare(b))
  ];
  const buttons = [
    '<button class="filter-chip active" type="button" data-category="all">All products</button>',
    ...orderedCategories.map((category) => `<button class="filter-chip" type="button" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`)
  ];
  categoryFilters.innerHTML = buttons.join("");
}

function renderProduct(product) {
  const saved = savedProductCodes.includes(product.code);
  const oldPrice = product.regularPrice && product.regularPrice > product.price
    ? `<span class="product-old-price">${formatUSD(getProductPrice(product.regularPrice))}</span><span class="sale-label">Offer</span>`
    : "";
  const safeName = escapeHtml(product.nameEn || product.name);
  const safeCode = escapeHtml(product.code);
  const safeImage = escapeHtml(product.image);
  const badge = oldPrice ? "LIMITED OFFER" : (product.categories || []).includes("Offers") ? "FARMASI OFFER" : "FARMASI";

  return `
    <article class="product-card" data-product-code="${safeCode}">
      <div class="product-image-wrap">
        <img src="${safeImage}" alt="${safeName}" loading="lazy">
        <span class="product-badge">${badge}</span>
        <button class="save-button${saved ? " saved" : ""}" type="button" data-save="${safeCode}" aria-label="${saved ? "Remove from" : "Save to"} favorites: ${safeName}" aria-pressed="${saved}">${saved ? "♥" : "♡"}</button>
      </div>
      <div class="product-details">
        <span class="product-category">${escapeHtml(product.category)}</span>
        <h3 class="product-name">${safeName}</h3>
        <p class="product-code">${safeCode}</p>
        <div class="product-price-row">
          <span class="product-price">${formatUSD(getProductPrice(product.price))}</span>
          ${oldPrice}
        </div>
        <div class="product-actions">
          <button type="button" data-save="${safeCode}">${saved ? "♥ Saved" : "♡ Save product"}</button>
          <button class="add-to-bag" type="button" data-add-to-bag="${safeCode}">
            <svg class="cart-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none">
              <path d="M3 4h2l2.2 10.1a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="10" cy="20" r="1.3" fill="currentColor"/>
              <circle cx="18" cy="20" r="1.3" fill="currentColor"/>
            </svg>
            Add to cart
          </button>
        </div>
      </div>
    </article>
  `;
}

function addToBag(code) {
  const product = PRODUCTS.find((entry) => entry.code === code);
  if (!product) {
    bagStatus.textContent = "That product is no longer available in the catalog.";
    return;
  }
  const quantity = shoppingBag[code] || 0;
  if (quantity >= 99) {
    bagStatus.textContent = "You can add up to 99 of each product.";
    return;
  }
  shoppingBag[code] = quantity + 1;
  bagStatus.textContent = `${product.nameEn || product.name} added to your bag.`;
  saveShoppingBag();
  renderBag();
}

function updateBagQuantity(code, quantity) {
  if (!PRODUCTS.some((product) => product.code === code)) return;
  if (!Number.isInteger(quantity) || quantity <= 0) {
    delete shoppingBag[code];
  } else {
    shoppingBag[code] = Math.min(quantity, 99);
  }
  saveShoppingBag();
  renderBag();
}

function getBagProducts() {
  return Object.entries(shoppingBag)
    .map(([code, quantity]) => ({
      product: PRODUCTS.find((entry) => entry.code === code),
      quantity
    }))
    .filter((item) => item.product);
}

function createWhatsAppOrder(items, total) {
  const lines = items.map(({ product, quantity }) => {
    const unitPrice = getProductPrice(product.price);
    return `• ${product.nameEn || product.name} (${product.code}) x${quantity} — ${formatUSD(unitPrice * quantity)}`;
  });
  const message = [
    "Hello! I'd like to place this order:",
    "",
    ...lines,
    "",
    `Total: ${formatUSD(total)}`,
    "Please confirm availability and delivery details."
  ].join("\n");
  return `https://wa.me/${ORDER_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderBag() {
  const items = getBagProducts();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const orderTotal = items.reduce((total, { product, quantity }) =>
    total + getProductPrice(product.price) * quantity, 0);

  bagCount.textContent = String(itemCount);
  document.querySelector(".bag-nav-link").setAttribute(
    "aria-label",
    `Shopping bag, ${itemCount} ${itemCount === 1 ? "item" : "items"}`
  );
  bagEmpty.hidden = items.length > 0;
  bagSummary.hidden = items.length === 0;
  bagItems.innerHTML = items.map(({ product, quantity }) => `
    <article class="bag-item" data-bag-code="${escapeHtml(product.code)}">
      <div class="bag-item-info">
        <h3>${escapeHtml(product.nameEn || product.name)}</h3>
        <span>${escapeHtml(product.code)} · ${formatUSD(getProductPrice(product.price))} each</span>
      </div>
      <label class="bag-quantity">
        <span>Qty</span>
        <input type="number" min="0" max="99" step="1" value="${quantity}" data-quantity="${escapeHtml(product.code)}" aria-label="Quantity for ${escapeHtml(product.nameEn || product.name)}">
      </label>
      <strong class="bag-line-total">${formatUSD(getProductPrice(product.price) * quantity)}</strong>
      <button class="bag-remove" type="button" data-remove="${escapeHtml(product.code)}" aria-label="Remove ${escapeHtml(product.nameEn || product.name)} from bag">Remove</button>
    </article>
  `).join("");
  bagTotal.textContent = formatUSD(orderTotal);
  whatsappOrder.href = items.length > 0
    ? createWhatsAppOrder(items, orderTotal)
    : `https://wa.me/${ORDER_WHATSAPP_NUMBER}`;
  whatsappOrder.setAttribute("aria-disabled", String(items.length === 0));
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function toggleSavedProduct(code) {
  savedProductCodes = savedProductCodes.includes(code)
    ? savedProductCodes.filter((savedCode) => savedCode !== code)
    : [...savedProductCodes, code];
  const saved = writeStorage(SAVED_STORAGE_KEY, JSON.stringify(savedProductCodes));
  renderProducts();
  if (!saved) console.error("Could not save Farmasi favorites for the next visit.");
}

renderCategoryFilters();

categoryFilters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  categoryFilters.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.toggle("active", chip === button);
  });
  renderProducts();
});

productSearch.addEventListener("input", renderProducts);
sortProducts.addEventListener("change", renderProducts);
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-save]");
  if (button) toggleSavedProduct(button.dataset.save);
});
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-add-to-bag]");
  if (button) addToBag(button.dataset.addToBag);
});
bagItems.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (button) updateBagQuantity(button.dataset.remove, 0);
});
bagItems.addEventListener("change", (event) => {
  const input = event.target.closest("[data-quantity]");
  if (!input) return;
  const quantity = Number(input.value);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 99) {
    bagStatus.textContent = "Choose a quantity from 0 to 99.";
    renderBag();
    return;
  }
  updateBagQuantity(input.dataset.quantity, quantity);
});
whatsappOrder.addEventListener("click", (event) => {
  if (Object.keys(shoppingBag).length === 0) event.preventDefault();
});

loadStoredPrices();
priceUpdated.textContent = `1 TRY = $${USD_PER_TRY} · FX ${fxDate} · prices ${priceSnapshotDate}`;
renderProducts();
renderBag();
