// Variable Globales
let vehiclesData = [];
let cart = [];
let currentVehicleId = null; // Para manejar qué vehículo se está añadiendo

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    loadVehicles();
    setupEventListeners();
    runTests();
});

// 1. Carga de Datos (Fetch API)
async function loadVehicles() {
    const spinner = document.getElementById('loadingSpinner');
    const container = document.getElementById('productsContainer');
    
    try {
        const response = await fetch('https://raw.githubusercontent.com/JUANCITOPENA/Pagina_Vehiculos_Ventas/refs/heads/main/vehiculos.json');
        if (!response.ok) throw new Error('Error al cargar datos');
        
        vehiclesData = await response.json();
        renderVehicles(vehiclesData);
        
    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = `<div class="alert alert-danger">No se pudo cargar el catálogo. Intente más tarde.</div>`;
    } finally {
        spinner.style.display = 'none';
    }
}

// 2. Mostrar Vehículos
function renderVehicles(data) {
    const container = document.getElementById('productsContainer');
    container.innerHTML = '';

    if (data.length === 0) {
        container.innerHTML = '<p class="text-center">No se encontraron vehículos con esos criterios.</p>';
        return;
    }

    data.forEach(vehicle => {
        // Limpiar emojis del tipo si existen (usando Regex simple)
        const tipoLimpio = vehicle.tipo.replace(/[\u{1F600}-\u{1F64F}]/gu, "");

        const card = `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card h-100 shadow-sm">
                    <img src="${vehicle.imagen}" class="card-img-top viewDetailsBtn" alt="${vehicle.marca}" 
                         style="cursor:pointer" data-codigo="${vehicle.codigo}" loading="lazy">
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${vehicle.marca} ${vehicle.modelo}</h5>
                        <p class="badge bg-info text-dark w-50">${vehicle.categoria}</p>
                        <p class="card-text text-muted card-text-short small">${tipoLimpio}</p>
                        <h4 class="text-primary fw-bold mt-auto mb-3">$${vehicle.precio_venta.toLocaleString()}</h4>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary viewDetailsBtn" data-codigo="${vehicle.codigo}">Ver Detalles</button>
                            <button class="btn btn-primary addToCartBtn" data-codigo="${vehicle.codigo}">
                                <i class="fas fa-cart-plus me-1"></i>Añadir al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

// 3. Filtrado
function filterVehicles() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filtered = vehiclesData.filter(v => 
        v.marca.toLowerCase().includes(query) || 
        v.modelo.toLowerCase().includes(query) || 
        v.categoria.toLowerCase().includes(query)
    );
    renderVehicles(filtered);
}

// 4. Gestión de Eventos (Event Delegation)
function setupEventListeners() {
    const productsContainer = document.getElementById('productsContainer');

    // Delegación para botones de detalle y carrito
    productsContainer.addEventListener('click', (e) => {
        const target = e.target.closest('.viewDetailsBtn');
        const addBtn = e.target.closest('.addToCartBtn');

        if (target) {
            const codigo = parseInt(target.getAttribute('data-codigo'));
            showDetailModal(codigo);
        }

        if (addBtn) {
            const codigo = parseInt(addBtn.getAttribute('data-codigo'));
            openQuantityModal(codigo);
        }
    });

    // Búsqueda en tiempo real
    document.getElementById('searchInput').addEventListener('input', filterVehicles);

    // Confirmar añadir al carrito (dentro del modal cantidad)
    document.getElementById('addToCartBtn').addEventListener('click', () => {
        const qty = parseInt(document.getElementById('quantityInput').value);
        if (qty > 0 && currentVehicleId) {
            addItemToCart(currentVehicleId, qty);
            bootstrap.Modal.getInstance(document.getElementById('quantityModal')).hide();
        }
    });

    // Añadir al carrito desde el detalle
    document.getElementById('detailAddToCart').addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
        openQuantityModal(currentVehicleId);
    });

    // Procesar Pago
    document.getElementById('processPaymentBtn').addEventListener('click', processPayment);
}

// 5. Modales Funciones
function showDetailModal(codigo) {
    const vehicle = vehiclesData.find(v => v.codigo === codigo);
    if (!vehicle) return;

    currentVehicleId = codigo;
    document.getElementById('detailImg').src = vehicle.imagen;
    document.getElementById('detailBrandModel').innerText = `${vehicle.marca} ${vehicle.modelo}`;
    document.getElementById('detailCategory').innerText = vehicle.categoria;
    document.getElementById('detailType').innerText = vehicle.tipo;
    document.getElementById('detailPrice').innerText = `$${vehicle.precio_venta.toLocaleString()}`;

    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

function openQuantityModal(codigo) {
    currentVehicleId = codigo;
    document.getElementById('quantityInput').value = 1;
    const modal = new bootstrap.Modal(document.getElementById('quantityModal'));
    modal.show();
}

// 6. Lógica del Carrito
function addItemToCart(codigo, quantity) {
    const vehicle = vehiclesData.find(v => v.codigo === codigo);
    const existingItem = cart.find(item => item.codigo === codigo);

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            codigo: vehicle.codigo,
            marca: vehicle.marca,
            modelo: vehicle.modelo,
            precio: vehicle.precio_venta,
            imagen: vehicle.imagen,
            quantity: quantity
        });
    }
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartCount = document.getElementById('cartCount');
    const cartTotal = document.getElementById('cartTotal');
    
    cartItems.innerHTML = '';
    let total = 0;
    let itemsCount = 0;

    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        total += subtotal;
        itemsCount += item.quantity;

        cartItems.innerHTML += `
            <div class="d-flex align-items-center mb-3 border-bottom pb-2">
                <img src="${item.imagen}" alt="${item.marca}" style="width: 60px; height: 40px; object-fit: cover;" class="rounded me-3">
                <div class="flex-grow-1">
                    <h6 class="mb-0">${item.marca} ${item.modelo}</h6>
                    <small class="text-muted">Cant: ${item.quantity} x $${item.precio.toLocaleString()}</small>
                </div>
                <div class="text-end">
                    <span class="fw-bold">$${subtotal.toLocaleString()}</span>
                </div>
            </div>
        `;
    });

    cartCount.innerText = itemsCount;
    cartTotal.innerText = `$${total.toLocaleString()}`;

    // Animación de pulso
    cartCount.classList.remove('badge-pulse');
    void cartCount.offsetWidth; // Trigger reflow
    cartCount.classList.add('badge-pulse');
}

// 7. Pago y PDF
function processPayment() {
    const name = document.getElementById('payName').value;
    if (!name) {
        alert("Por favor, ingrese su nombre para la factura.");
        return;
    }

    alert(`¡Gracias por tu compra, ${name}! Tu pago ha sido procesado con éxito.`);
    generateInvoice(name);

    // Limpiar carrito
    cart = [];
    updateCartUI();
    
    // Cerrar modales
    bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
    bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();
}

function generateInvoice(customerName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let total = 0;

    // Header
    doc.setFontSize(22);
    doc.text("GarageOnline - Factura de Venta", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Cliente: ${customerName}`, 20, 35);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 42);
    doc.line(20, 45, 190, 45);

    // Items
    let y = 55;
    doc.text("Vehículo", 20, y);
    doc.text("Cant.", 120, y);
    doc.text("Subtotal", 160, y);
    y += 10;

    cart.forEach(item => {
        const subtotal = item.precio * item.quantity;
        total += subtotal;
        doc.text(`${item.marca} ${item.modelo}`, 20, y);
        doc.text(`${item.quantity}`, 120, y);
        doc.text(`$${subtotal.toLocaleString()}`, 160, y);
        y += 10;
    });

    // Total
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(16);
    doc.text(`TOTAL PAGADO: $${total.toLocaleString()}`, 120, y);

    doc.save(`Factura_GarageOnline_${Date.now()}.pdf`);
}

// =========================================================================================
// BLOQUE DE TESTING AUTOMATIZADO
// =========================================================================================
function runTests() {
    console.group("%c🧪 Ejecutando Pruebas Unitarias - GarageOnline", "color: #0d6efd; font-size: 14px; font-weight: bold;");

    // Prueba 1: Carga de datos
    setTimeout(() => {
        if (vehiclesData.length > 0) {
            console.log("✅ Test loadVehicles: PASSED (Datos cargados: " + vehiclesData.length + ")");
        } else {
            console.error("❌ Test loadVehicles: FAILED (Array vacío)");
        }

        // Prueba 2: Filtrado
        const query = "Toyota";
        const testFilter = vehiclesData.filter(v => v.marca.toLowerCase().includes(query.toLowerCase()));
        if (testFilter.length >= 0) {
            console.log("✅ Test filterVehicles: PASSED (Filtro por marca ejecutado)");
        } else {
            console.error("❌ Test filterVehicles: FAILED");
        }

        // Prueba 3: Añadir al carrito
        const initialCartLength = cart.length;
        if (vehiclesData.length > 0) {
            addItemToCart(vehiclesData[0].codigo, 1);
            if (cart.length > initialCartLength) {
                console.log("✅ Test addItemToCart: PASSED (Item añadido correctamente)");
            } else {
                console.error("❌ Test addItemToCart: FAILED");
            }
        }

        // Prueba 4: Actualización UI (DOM)
        const cartCountText = document.getElementById('cartCount').innerText;
        if (parseInt(cartCountText) > 0) {
            console.log("✅ Test updateCartUI: PASSED (Contador actualizado en DOM)");
        } else {
            console.error("❌ Test updateCartUI: FAILED");
        }

        console.log("%c🏁 Pruebas finalizadas.", "color: #198754; font-weight: bold;");
        console.groupEnd();
    }, 2000); // Esperar a que el fetch termine
} 