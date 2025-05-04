/**
 * Shopping OPPER Myanmar - Main JavaScript File
 * 
 * This file contains all the front-end functionality for the shopping website
 */

// Initialize Pusher for real-time updates
const pusher = new Pusher('8c2540a0c402d0c7aafe', {
    cluster: 'ap1',
    encrypted: true
});

// Subscribe to different channels for real-time updates
const productChannel = pusher.subscribe('products');
const orderChannel = pusher.subscribe('orders');
const postChannel = pusher.subscribe('posts');

// DOM Elements
const productsContainer = document.getElementById('products-container');
const postsContainer = document.getElementById('posts-container');
const ordersContainer = document.getElementById('orders-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const searchForm = document.getElementById('search-form');

// User ID generation
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = generateRandomId();
    localStorage.setItem('userId', userId);
}

const userIdElement = document.getElementById('user-id');
if (userIdElement) {
    userIdElement.innerText = userId;
}

// Initialize logged in state
let isLoggedIn = false;
const storedUserData = localStorage.getItem('userData');
if (storedUserData) {
    isLoggedIn = true;
    try {
        const userData = JSON.parse(storedUserData);
        updateLoginUI(userData);
    } catch (error) {
        console.error('Error parsing user data:', error);
    }
}

// Navigation and tab management
function showPage(pageId) {
    const pages = ['home-page', 'products-page', 'orders-page', 'posts-page', 'about-page', 'signup-page'];
    pages.forEach(page => {
        const element = document.getElementById(page);
        if (element) {
            element.style.display = page === pageId ? 'block' : 'none';
        }
    });

    // Update active nav link
    const navLinks = document.querySelectorAll('.nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });

    // Load content based on current page
    if (pageId === 'products-page' && productsContainer) {
        loadProducts();
    } else if (pageId === 'orders-page' && ordersContainer) {
        loadOrders();
    } else if (pageId === 'posts-page' && postsContainer) {
        loadPosts();
    }

    // Update URL hash for page refresh state
    window.location.hash = pageId;
}

// Initialize page based on URL hash
function initPageFromHash() {
    const hash = window.location.hash.substring(1);
    if (hash && document.getElementById(hash)) {
        showPage(hash);
    } else {
        showPage('home-page'); // Default page
    }
}

// API functions with Supabase backend
async function loadProducts(query = '') {
    if (!productsContainer) return;

    try {
        productsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const url = query ? 
            `/.netlify/functions/data?action=getProducts&search=${encodeURIComponent(query)}` : 
            '/.netlify/functions/data?action=getProducts';
        
        const response = await fetch(url);
        const products = await response.json();
        
        renderProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        productsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>ပစ္စည်းများ ရယူရာတွင် အမှားရှိနေပါသည်။ နောက်မှ ပြန်လည်ကြိုးစားပေးပါ။</p>
            </div>
        `;
    }
}

async function loadFeaturedProducts() {
    const featuredContainer = document.getElementById('featured-products');
    if (!featuredContainer) return;

    try {
        featuredContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const response = await fetch('/.netlify/functions/data?action=getProducts');
        const products = await response.json();
        
        // Filter for non-sold out products and take the first 4
        const featuredProducts = products
            .filter(product => !product.sold_out)
            .slice(0, 4);
        
        if (featuredProducts.length > 0) {
            featuredContainer.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
        } else {
            featuredContainer.innerHTML = '<p class="text-center">ရွေးချယ်ထားသော ပစ္စည်းများ မရှိသေးပါ။</p>';
        }
    } catch (error) {
        console.error('Error loading featured products:', error);
        featuredContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>ပစ္စည်းများ ရယူရာတွင် အမှားရှိနေပါသည်။ နောက်မှ ပြန်လည်ကြိုးစားပေးပါ။</p>
            </div>
        `;
    }
}

async function loadPosts() {
    if (!postsContainer) return;

    try {
        postsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const response = await fetch('/.netlify/functions/data?action=getPosts');
        const posts = await response.json();
        
        if (posts.length > 0) {
            postsContainer.innerHTML = posts.map(post => createPostCard(post)).join('');
        } else {
            postsContainer.innerHTML = '<p class="text-center">သတင်းများ မရှိသေးပါ။</p>';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>သတင်းများ ရယူရာတွင် အမှားရှိနေပါသည်။ နောက်မှ ပြန်လည်ကြိုးစားပေးပါ။</p>
            </div>
        `;
    }
}

async function loadLatestPosts() {
    const latestPostsContainer = document.getElementById('latest-posts');
    if (!latestPostsContainer) return;

    try {
        latestPostsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const response = await fetch('/.netlify/functions/data?action=getPosts');
        const posts = await response.json();
        
        // Take the first 3 posts
        const latestPosts = posts.slice(0, 3);
        
        if (latestPosts.length > 0) {
            latestPostsContainer.innerHTML = latestPosts.map(post => createPostCard(post)).join('');
        } else {
            latestPostsContainer.innerHTML = '<p class="text-center">သတင်းများ မရှိသေးပါ။</p>';
        }
    } catch (error) {
        console.error('Error loading latest posts:', error);
        latestPostsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>သတင်းများ ရယူရာတွင် အမှားရှိနေပါသည်။ နောက်မှ ပြန်လည်ကြိုးစားပေးပါ။</p>
            </div>
        `;
    }
}

async function loadOrders() {
    if (!ordersContainer) return;
    
    if (!isLoggedIn) {
        ordersContainer.innerHTML = `
            <div class="login-required">
                <i class="fas fa-lock"></i>
                <h3>အမှာစာများကြည့်ရှုရန် အကောင့်ဝင်ရန် လိုအပ်ပါသည်</h3>
                <p>သင့်အမှာစာများကို ကြည့်ရှုနိုင်ရန် ကျေးဇူးပြု၍ အကောင့်ဝင်ပါ။</p>
                <button class="btn btn-primary" onclick="openLoginModal()">အကောင့်ဝင်ရန်</button>
            </div>
        `;
        return;
    }

    try {
        ordersContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>';
        
        const userData = JSON.parse(localStorage.getItem('userData'));
        const userChannel = pusher.subscribe(`orders-${userData.id}`);
        
        userChannel.bind('orderUpdated', () => {
            loadOrders(); // Reload orders when updates happen
        });
        
        const response = await fetch(`/.netlify/functions/data?action=getOrders&userId=${userData.id}`);
        const orders = await response.json();
        
        if (orders.length > 0) {
            ordersContainer.innerHTML = orders.map(order => createOrderCard(order)).join('');
        } else {
            ordersContainer.innerHTML = '<p class="text-center">သင့်တွင် အမှာစာများ မရှိသေးပါ။</p>';
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        ordersContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>အမှာစာများ ရယူရာတွင် အမှားရှိနေပါသည်။ နောက်မှ ပြန်လည်ကြိုးစားပေးပါ။</p>
            </div>
        `;
    }
}

// Search functionality
if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const query = searchInput.value.trim();
        loadProducts(query);
        
        // Show products page and highlight it in navigation
        showPage('products-page');
    });
}

// Rendering functions
function renderProducts(products) {
    if (!productsContainer) return;
    
    if (products.length > 0) {
        productsContainer.innerHTML = products.map(product => createProductCard(product)).join('');
    } else {
        productsContainer.innerHTML = '<p class="text-center">ပစ္စည်းများ မတွေ့ရှိပါ။</p>';
    }
}

function createProductCard(product) {
    const timestamp = new Date(product.date || product.created_at);
    const formattedDate = formatDate(timestamp);
    const formattedPrice = formatPrice(product.price);
    const soldOutBadge = product.sold_out ? 
        `<div class="sold-out-overlay"><img src="https://i.imgur.com/6HoXSDo.png" alt="အရောင်းပြီး" class="sold-out"></div>` : '';

    return `
        <div class="product-card">
            <div class="product-image">
                <img src="${product.image || 'https://via.placeholder.com/300?text=ပုံမရှိပါ'}" alt="${product.name}">
                ${soldOutBadge}
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <div class="product-price"><i class="fas fa-tag"></i> ${formattedPrice}</div>
                    <div class="product-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</div>
                </div>
                <div class="payment-options">
                    <div class="payment-option">
                        <img src="https://i.imgur.com/pnlVj08.png" alt="KBZ Pay">
                        <span>KBZ Pay</span>
                    </div>
                    <div class="payment-option">
                        <img src="https://i.imgur.com/33YDkfY.png" alt="Wave Money">
                        <span>Wave Money</span>
                    </div>
                    <div class="payment-option">
                        <img src="https://i.imgur.com/6GLbxGD.png" alt="Cash on Delivery">
                        <span>ပစ္စည်းရောက်မှငွေချေရန်</span>
                    </div>
                </div>
                <button class="order-btn" ${product.sold_out ? 'disabled' : ''} onclick="openOrderModal(${JSON.stringify(product).replace(/"/g, '&quot;')})">
                    ${product.sold_out ? 
                        '<i class="fas fa-times-circle"></i> အရောင်းပြီးပါပြီ' : 
                        '<i class="fas fa-shopping-cart"></i> ဝယ်ယူမည်'
                    }
                </button>
            </div>
        </div>
    `;
}

function createPostCard(post) {
    const timestamp = new Date(post.date || post.created_at);
    const formattedDate = formatDate(timestamp);

    return `
        <div class="post-card">
            ${post.image ? `
                <div class="post-image">
                    <img src="${post.image}" alt="${post.title}">
                </div>
            ` : ''}
            <div class="post-content">
                <h3 class="post-title">${post.title}</h3>
                <p class="post-description">${post.content}</p>
                <div class="post-footer">
                    <div class="post-date"><i class="far fa-calendar-alt"></i> ${formattedDate}</div>
                    <a href="#" class="read-more" onclick="openPostModal(${JSON.stringify(post).replace(/"/g, '&quot;')})">
                        အပြည့်အစုံဖတ်ရန် <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </div>
        </div>
    `;
}

function createOrderCard(order) {
    const timestamp = new Date(order.order_time);
    const formattedDate = formatDate(timestamp);
    let statusBadge;
    
    switch(order.status) {
        case 'စိစစ်နေဆဲ':
            statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> စိစစ်နေဆဲ</span>';
            break;
        case 'အတည်ပြု':
            statusBadge = '<span class="status-badge status-approved"><i class="fas fa-check-circle"></i> အတည်ပြု</span>';
            break;
        case 'ငြင်းပယ်':
            statusBadge = '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> ငြင်းပယ်</span>';
            break;
        default:
            statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> စိစစ်နေဆဲ</span>';
    }

    return `
        <div class="order-card">
            <div class="product-image">
                <img src="${order.product_image || 'https://via.placeholder.com/300?text=ပုံမရှိပါ'}" alt="${order.product_name}">
            </div>
            <div class="product-info">
                <div class="order-header">
                    <h3 class="product-title">${order.product_name}</h3>
                    ${statusBadge}
                </div>
                <div class="order-details">
                    <p><i class="fas fa-money-bill-wave"></i> ငွေပေးချေမှု: ${order.payment_method}</p>
                    <p><i class="fas fa-map-marker-alt"></i> လိပ်စာ: ${order.shipping_address}</p>
                    <p><i class="far fa-clock"></i> အချိန်: ${formattedDate}</p>
                </div>
                <button class="order-btn" onclick="openOrderDetailModal(${JSON.stringify(order).replace(/"/g, '&quot;')})">
                    <i class="fas fa-info-circle"></i> အသေးစိတ်ကြည့်ရန်
                </button>
            </div>
        </div>
    `;
}

// Modal Functions
function openOrderModal(product) {
    const orderModal = document.getElementById('order-modal');
    const modalContent = orderModal.querySelector('.modal-content');
    
    const formattedPrice = formatPrice(product.price);
    
    modalContent.innerHTML = `
        <span class="close-modal" onclick="closeOrderModal()">&times;</span>
        <h2 class="modal-title">ဝယ်ယူမှု အတည်ပြုခြင်း</h2>
        
        <div class="product-preview">
            <img src="${product.image || 'https://via.placeholder.com/100?text=ပုံမရှိပါ'}" alt="${product.name}" class="product-preview-img">
            <div class="product-preview-info">
                <h3>${product.name}</h3>
                <p class="product-price">${formattedPrice}</p>
            </div>
        </div>
        
        <form id="order-form">
            <input type="hidden" id="product-id" value="${product.id}">
            <input type="hidden" id="product-name" value="${product.name}">
            <input type="hidden" id="product-image" value="${product.image}">
            
            <div class="form-group">
                <label for="telegram-username">နာမည် <span class="required">*</span></label>
                <input type="text" id="telegram-username" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label for="shipping-address">ပို့ဆောင်ရမည့်လိပ်စာ <span class="required">*</span></label>
                <textarea id="shipping-address" class="form-control" required></textarea>
            </div>
            
            <div class="form-group">
                <label>ငွေပေးချေမှုနည်းလမ်း <span class="required">*</span></label>
                <div class="payment-method-options">
                    <label class="payment-method-option">
                        <input type="radio" name="payment-method" value="KBZ Pay" required>
                        <img src="https://i.imgur.com/pnlVj08.png" alt="KBZ Pay">
                        <span>KBZ Pay</span>
                    </label>
                    
                    <label class="payment-method-option">
                        <input type="radio" name="payment-method" value="Wave Money" required>
                        <img src="https://i.imgur.com/33YDkfY.png" alt="Wave Money">
                        <span>Wave Money</span>
                    </label>
                    
                    <label class="payment-method-option">
                        <input type="radio" name="payment-method" value="ပစ္စည်းရောက်မှငွေချေရန်" required checked>
                        <img src="https://i.imgur.com/6GLbxGD.png" alt="Cash on Delivery">
                        <span>ပစ္စည်းရောက်မှငွေချေရန်</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group transaction-id-container" style="display: none;">
                <label for="transaction-id">ငွေပေးချေမှု အမှတ်စဥ် <span class="required">*</span></label>
                <input type="text" id="transaction-id" class="form-control">
                <small>ကျေးဇူးပြု၍ KBZ Pay သို့မဟုတ် Wave Money တွင် ငွေပေးချေမှုအမှတ်စဥ်ကို ထည့်သွင်းပေးပါ</small>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeOrderModal()">ပယ်ဖျက်မည်</button>
                <button type="submit" class="btn btn-primary">အမှာစာတင်မည်</button>
            </div>
        </form>
    `;
    
    // Show/hide transaction ID field based on payment method
    const paymentMethodOptions = modalContent.querySelectorAll('input[name="payment-method"]');
    const transactionIdContainer = modalContent.querySelector('.transaction-id-container');
    
    paymentMethodOptions.forEach(option => {
        option.addEventListener('change', function() {
            const requiresTransactionId = this.value === 'KBZ Pay' || this.value === 'Wave Money';
            transactionIdContainer.style.display = requiresTransactionId ? 'block' : 'none';
            const transactionIdInput = document.getElementById('transaction-id');
            transactionIdInput.required = requiresTransactionId;
        });
    });
    
    // Handle form submission
    const orderForm = document.getElementById('order-form');
    orderForm.addEventListener('submit', function(event) {
        event.preventDefault();
        submitOrder(product);
    });
    
    orderModal.style.display = 'flex';
}

function closeOrderModal() {
    const orderModal = document.getElementById('order-modal');
    orderModal.style.display = 'none';
}

function openPostModal(post) {
    const postModal = document.getElementById('post-modal');
    const modalContent = postModal.querySelector('.modal-content');
    const timestamp = new Date(post.date || post.created_at);
    const formattedDate = formatDate(timestamp);
    
    modalContent.innerHTML = `
        <span class="close-modal" onclick="closePostModal()">&times;</span>
        <h2 class="modal-title">${post.title}</h2>
        
        ${post.image ? `<div class="post-modal-image"><img src="${post.image}" alt="${post.title}"></div>` : ''}
        
        <div class="post-modal-meta">
            <span><i class="far fa-user"></i> ${post.author || 'Admin'}</span>
            <span><i class="far fa-calendar-alt"></i> ${formattedDate}</span>
        </div>
        
        <div class="post-modal-content">
            ${post.content}
        </div>
        
        ${post.video ? `
            <div class="post-modal-video">
                <iframe width="100%" height="315" src="${post.video}" frameborder="0" allowfullscreen></iframe>
            </div>
        ` : ''}
    `;
    
    postModal.style.display = 'flex';
}

function closePostModal() {
    const postModal = document.getElementById('post-modal');
    postModal.style.display = 'none';
}

function openOrderDetailModal(order) {
    const orderDetailModal = document.getElementById('order-detail-modal');
    const modalContent = orderDetailModal.querySelector('.modal-content');
    const timestamp = new Date(order.order_time);
    const formattedDate = formatDate(timestamp);
    
    let statusBadge;
    switch(order.status) {
        case 'စိစစ်နေဆဲ':
            statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> စိစစ်နေဆဲ</span>';
            break;
        case 'အတည်ပြု':
            statusBadge = '<span class="status-badge status-approved"><i class="fas fa-check-circle"></i> အတည်ပြု</span>';
            break;
        case 'ငြင်းပယ်':
            statusBadge = '<span class="status-badge status-rejected"><i class="fas fa-times-circle"></i> ငြင်းပယ်</span>';
            break;
        default:
            statusBadge = '<span class="status-badge status-pending"><i class="fas fa-clock"></i> စိစစ်နေဆဲ</span>';
    }
    
    modalContent.innerHTML = `
        <span class="close-modal" onclick="closeOrderDetailModal()">&times;</span>
        <h2 class="modal-title">အော်ဒါအချက်အလက်</h2>
        
        <div class="order-detail-header">
            <img src="${order.product_image || 'https://via.placeholder.com/100?text=ပုံမရှိပါ'}" alt="${order.product_name}" class="order-detail-img">
            <div class="order-detail-info">
                <h3>${order.product_name}</h3>
                ${statusBadge}
            </div>
        </div>
        
        <div class="order-detail-content">
            <div class="detail-item">
                <span class="detail-label">အော်ဒါအမှတ်:</span>
                <span class="detail-value">${order.id}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">မှာယူသည့်အချိန်:</span>
                <span class="detail-value">${formattedDate}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">အမည်:</span>
                <span class="detail-value">${order.telegram_username}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">လိပ်စာ:</span>
                <span class="detail-value">${order.shipping_address}</span>
            </div>
            
            <div class="detail-item">
                <span class="detail-label">ငွေပေးချေမှုနည်းလမ်း:</span>
                <span class="detail-value">${order.payment_method}</span>
            </div>
            
            ${order.transaction_id ? `
                <div class="detail-item">
                    <span class="detail-label">ငွေပေးချေမှုအမှတ်စဥ်:</span>
                    <span class="detail-value">${order.transaction_id}</span>
                </div>
            ` : ''}
        </div>
        
        <div class="order-detail-footer">
            <button class="btn btn-primary" onclick="closeOrderDetailModal()">
                <i class="fas fa-check"></i> အိုကေ
            </button>
        </div>
    `;
    
    orderDetailModal.style.display = 'flex';
}

function closeOrderDetailModal() {
    const orderDetailModal = document.getElementById('order-detail-modal');
    orderDetailModal.style.display = 'none';
}

// Authentication functions
function openLoginModal() {
    const loginModal = document.getElementById('login-modal');
    const modalContent = loginModal.querySelector('.modal-content');
    
    modalContent.innerHTML = `
        <span class="close-modal" onclick="closeLoginModal()">&times;</span>
        <h2 class="modal-title">အကောင့်ဝင်ရန်</h2>
        
        <form id="login-form">
            <div class="form-group">
                <label for="login-email">အီးမေးလ် <span class="required">*</span></label>
                <input type="email" id="login-email" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label for="login-password">စကားဝှက် <span class="required">*</span></label>
                <input type="password" id="login-password" class="form-control" required>
            </div>
            
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeLoginModal()">ပယ်ဖျက်မည်</button>
                <button type="submit" class="btn btn-primary">ဝင်ရောက်မည်</button>
            </div>
            
            <div class="login-options">
                <p>အကောင့်မရှိသေးပါက <a href="#" onclick="showPage('signup-page'); closeLoginModal();">အကောင့်အသစ်ဖွင့်ရန်</a></p>
            </div>
        </form>
    `;
    
    // Handle form submission
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Mock login for demonstration
        // In a real app, this would call the authentication API
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        // Simulate user login
        const userData = {
            id: userId,
            email: email,
            name: email.split('@')[0]
        };
        
        localStorage.setItem('userData', JSON.stringify(userData));
        isLoggedIn = true;
        
        updateLoginUI(userData);
        loadOrders(); // Reload orders with authenticated user
        closeLoginModal();
        
        showSuccessMessage('အကောင့်ဝင်ရန် အောင်မြင်ပါသည်');
    });
    
    loginModal.style.display = 'flex';
}

function closeLoginModal() {
    const loginModal = document.getElementById('login-modal');
    loginModal.style.display = 'none';
}

function updateLoginUI(userData) {
    const userIdElement = document.getElementById('user-id');
    if (userIdElement) {
        userIdElement.innerHTML = `<i class="fas fa-user"></i> ${userData.name || userData.email.split('@')[0]}`;
    }
    
    // Update login/logout button in navigation
    const loginButton = document.querySelector('.nav a[data-action="login"]');
    if (loginButton) {
        loginButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> ထွက်မည်';
        loginButton.setAttribute('data-action', 'logout');
        loginButton.onclick = function() {
            logoutUser();
            return false;
        };
    }
}

function logoutUser() {
    localStorage.removeItem('userData');
    isLoggedIn = false;
    
    // Update UI for logged out state
    const userIdElement = document.getElementById('user-id');
    if (userIdElement) {
        userIdElement.innerHTML = `<i class="fas fa-user"></i> ${userId}`;
    }
    
    // Update logout button back to login
    const logoutButton = document.querySelector('.nav a[data-action="logout"]');
    if (logoutButton) {
        logoutButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> အကောင့်ဝင်ရန်';
        logoutButton.setAttribute('data-action', 'login');
        logoutButton.onclick = function() {
            openLoginModal();
            return false;
        };
    }
    
    // Reload orders for non-authenticated view
    loadOrders();
    
    showSuccessMessage('အကောင့်မှထွက်ခွာခဲ့ပါပြီ');
}

// Order submission
async function submitOrder(product) {
    const telegramUsername = document.getElementById('telegram-username').value;
    const shippingAddress = document.getElementById('shipping-address').value;
    const paymentMethodRadios = document.getElementsByName('payment-method');
    let paymentMethod = '';
    
    for (const radio of paymentMethodRadios) {
        if (radio.checked) {
            paymentMethod = radio.value;
            break;
        }
    }
    
    const transactionId = document.getElementById('transaction-id')?.value || '';
    
    if (!telegramUsername || !shippingAddress || !paymentMethod) {
        showErrorMessage('အချက်အလက်အားလုံး ဖြည့်စွက်ပေးပါ');
        return;
    }
    
    // Get user data if logged in, or use guest ID
    const userData = isLoggedIn ? JSON.parse(localStorage.getItem('userData')) : { id: userId };
    
    const orderData = {
        id: generateRandomId(),
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        telegramUsername,
        shippingAddress,
        paymentMethod,
        transactionId,
        status: 'စိစစ်နေဆဲ',
        orderTime: new Date().toISOString(),
        userId: userData.id
    };
    
    try {
        const response = await fetch('/.netlify/functions/data', {
            method: 'POST',
            body: JSON.stringify({
                action: 'placeOrder',
                ...orderData
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            closeOrderModal();
            showSuccessMessage('အောင်မြင်စွာ မှာယူထားပါပြီ');
            // Show orders page with the new order
            showPage('orders-page');
        } else {
            showErrorMessage(result.message || 'အမှာစာတင်ရာတွင် အမှားရှိနေပါသည်');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showErrorMessage('အမှာစာတင်ရာတွင် အမှားရှိနေပါသည်');
    }
}

// Sign up process
if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const phone = document.getElementById('signup-phone').value;
        const password = document.getElementById('signup-password').value;
        const address = document.getElementById('signup-address').value;
        
        if (!name || !email || !phone || !password) {
            showErrorMessage('အချက်အလက်အားလုံး ဖြည့်စွက်ပေးပါ');
            return;
        }
        
        try {
            const userData = {
                id: generateRandomId(),
                name,
                email,
                phone,
                password,
                address
            };
            
            const response = await fetch('/.netlify/functions/data', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'createUser',
                    ...userData
                })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Auto login after signup
                localStorage.setItem('userData', JSON.stringify(userData));
                isLoggedIn = true;
                updateLoginUI(userData);
                
                showSuccessMessage('အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်');
                showPage('home-page');
                
                // Clear form
                document.getElementById('signup-form').reset();
            } else {
                showErrorMessage(result.message || 'အကောင့်ဖွင့်ရာတွင် အမှားရှိနေပါသည်');
            }
        } catch (error) {
            console.error('Error signing up:', error);
            showErrorMessage('အကောင့်ဖွင့်ရာတွင် အမှားရှိနေပါသည်');
        }
    });
}

// Helper functions
function generateRandomId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return 'အချိန်မရရှိပါ';
    }
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('my-MM', options);
}

function formatPrice(price) {
    const numPrice = Number(price);
    if (isNaN(numPrice)) {
        return 'စျေးနှုန်းမရရှိပါ';
    }
    
    return numPrice.toLocaleString('my-MM') + ' ကျပ်';
}

function showSuccessMessage(message) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(successMessage);
    
    setTimeout(() => {
        document.body.removeChild(successMessage);
    }, 3000);
}

function showErrorMessage(message) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(errorMessage);
    
    setTimeout(() => {
        document.body.removeChild(errorMessage);
    }, 3000);
}

// Event listeners for real-time updates
productChannel.bind('productUpdated', function() {
    if (document.getElementById('products-page').style.display === 'block') {
        loadProducts();
    }
    loadFeaturedProducts();
});

postChannel.bind('postUpdated', function() {
    if (document.getElementById('posts-page').style.display === 'block') {
        loadPosts();
    }
    loadLatestPosts();
});

orderChannel.bind('newOrder', function() {
    // Add notification for admin if needed
});

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initPageFromHash();
    loadFeaturedProducts();
    loadLatestPosts();
    
    // Set up click handlers for navigation
    document.querySelectorAll('.nav a[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });
    
    // Set up login button handler
    const loginButton = document.querySelector('.nav a[data-action="login"]');
    if (loginButton) {
        loginButton.addEventListener('click', function(e) {
            e.preventDefault();
            openLoginModal();
        });
    }
    
    // Listen for hash changes
    window.addEventListener('hashchange', initPageFromHash);
});
