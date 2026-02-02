// =========================
// UTILITY FUNCTIONS
// =========================

// Check if element exists before using it
const safeQuery = (selector) => {
  return document.querySelector(selector);
};

const safeQueryAll = (selector) => {
  return document.querySelectorAll(selector);
};

// Debounce function for performance
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// =========================
// MOBILE NAVIGATION
// =========================

const menuIcon = safeQuery('.menu');
const navLinks = safeQuery('.nav-links');
const navLinkItems = safeQueryAll('.nav-link');

// Mobile menu toggle with better error handling
if (menuIcon && navLinks) {
  const toggleMenu = () => {
    navLinks.classList.toggle('active');
    menuIcon.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.classList.toggle('menu-open');
    
    // Update ARIA attributes for accessibility
    const isOpen = navLinks.classList.contains('active');
    menuIcon.setAttribute('aria-expanded', isOpen);
    navLinks.setAttribute('aria-hidden', !isOpen);
  };

  // Handle both click and touch events
  menuIcon.addEventListener('click', toggleMenu);
  menuIcon.addEventListener('touchstart', toggleMenu, { passive: true });
  
  // Keyboard accessibility (Enter/Space)
  menuIcon.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu();
    }
  });
}

// Close menu when navigation links are clicked
if (navLinkItems.length > 0) {
  navLinkItems.forEach(link => {
    const closeMenu = () => {
      if (navLinks) {
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
      if (menuIcon) {
        menuIcon.classList.remove('active');
        menuIcon.setAttribute('aria-expanded', 'false');
      }
    };

    link.addEventListener('click', closeMenu);
    link.addEventListener('touchend', closeMenu, { passive: true });
  });
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
  if (navLinks && menuIcon && navLinks.classList.contains('active')) {
    if (!navLinks.contains(e.target) && !menuIcon.contains(e.target)) {
      navLinks.classList.remove('active');
      menuIcon.classList.remove('active');
      document.body.classList.remove('menu-open');
      menuIcon.setAttribute('aria-expanded', 'false');
    }
  }
});

// Close menu on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
    navLinks.classList.remove('active');
    if (menuIcon) {
      menuIcon.classList.remove('active');
      menuIcon.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('menu-open');
  }
});

// =========================
// CONTACT FORM HANDLING
// =========================

const handleContactSubmit = (event) => {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const submitButton = form.querySelector('button[type="submit"]');
  const successMessage = safeQuery('#formSuccess');
  
  // Clear previous errors
  const errorMessages = form.querySelectorAll('.error-message');
  errorMessages.forEach(error => error.textContent = '');
  
  // Validation
  let isValid = true;
  const errors = {};
  
  // Name validation
  const name = formData.get('name');
  if (!name || name.trim().length < 2) {
    errors.name = 'Please enter a valid name (at least 2 characters)';
    isValid = false;
  }
  
  // Email validation
  const email = formData.get('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    errors.email = 'Please enter a valid email address';
    isValid = false;
  }
  
  // Subject validation
  const subject = formData.get('subject');
  if (!subject) {
    errors.subject = 'Please select a subject';
    isValid = false;
  }
  
  // Message validation
  const message = formData.get('message');
  if (!message || message.trim().length < 10) {
    errors.message = 'Please enter a message (at least 10 characters)';
    isValid = false;
  }
  
  // Display errors
  Object.keys(errors).forEach(field => {
    const errorElement = safeQuery(`#${field}Error`);
    if (errorElement) {
      errorElement.textContent = errors[field];
    }
  });
  
  if (!isValid) return;
  
  // Show loading state
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
  }
  
  // Simulate form submission (replace with actual API call)
  setTimeout(() => {
    form.style.display = 'none';
    if (successMessage) {
      successMessage.style.display = 'block';
    }
    
    // Reset form after 5 seconds
    setTimeout(() => {
      form.reset();
      form.style.display = 'block';
      if (successMessage) {
        successMessage.style.display = 'none';
      }
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Message';
      }
    }, 5000);
  }, 1500);
};

// Make function globally available
window.handleContactSubmit = handleContactSubmit;

// =========================
// INVENTORY FILTERING & SORTING
// =========================

let allVehicles = [];
let filteredVehicles = [];

const initializeInventory = () => {
  const vehicleCards = safeQueryAll('.vehicle-grid .card');
  allVehicles = Array.from(vehicleCards);
  filteredVehicles = [...allVehicles];
  updateVehicleCount();
};

const updateVehicleCount = () => {
  const countElement = safeQuery('#vehicleCount');
  if (countElement) {
    countElement.textContent = filteredVehicles.length;
  }
};

const clearFilters = () => {
  const priceFilter = safeQuery('#priceFilter');
  const typeFilter = safeQuery('#typeFilter');
  const fuelFilter = safeQuery('#fuelFilter');
  const sortBy = safeQuery('#sortBy');
  
  if (priceFilter) priceFilter.value = '';
  if (typeFilter) typeFilter.value = '';
  if (fuelFilter) fuelFilter.value = '';
  if (sortBy) sortBy.value = 'featured';
  
  applyFilters();
};

const applyFilters = () => {
  const priceFilter = safeQuery('#priceFilter');
  const typeFilter = safeQuery('#typeFilter');
  const fuelFilter = safeQuery('#fuelFilter');
  const sortBy = safeQuery('#sortBy');
  const noResults = safeQuery('#noResults');
  const vehicleGrid = safeQuery('#vehicleGrid');
  
  if (!vehicleGrid) return;
  
  filteredVehicles = allVehicles.filter(card => {
    const price = parseInt(card.dataset.price);
    const type = card.dataset.type;
    const fuel = card.dataset.fuel;
    
    // Price filter
    if (priceFilter && priceFilter.value) {
      const [min, max] = priceFilter.value.split('-').map(v => v === '' ? Infinity : parseInt(v));
      if (max && (price < min || price > max)) return false;
      if (!max && price < min) return false;
    }
    
    // Type filter
    if (typeFilter && typeFilter.value && type !== typeFilter.value) return false;
    
    // Fuel filter
    if (fuelFilter && fuelFilter.value && fuel !== fuelFilter.value) return false;
    
    return true;
  });
  
  // Sort vehicles
  if (sortBy && sortBy.value) {
    filteredVehicles.sort((a, b) => {
      switch (sortBy.value) {
        case 'price-low':
          return parseInt(a.dataset.price) - parseInt(b.dataset.price);
        case 'price-high':
          return parseInt(b.dataset.price) - parseInt(a.dataset.price);
        case 'year-new':
          return parseInt(b.dataset.year) - parseInt(a.dataset.year);
        case 'year-old':
          return parseInt(a.dataset.year) - parseInt(b.dataset.year);
        default:
          return 0;
      }
    });
  }
  
  // Hide all cards
  allVehicles.forEach(card => card.style.display = 'none');
  
  // Show filtered cards
  filteredVehicles.forEach(card => card.style.display = 'block');
  
  // Show/hide no results message
  if (noResults) {
    noResults.style.display = filteredVehicles.length === 0 ? 'block' : 'none';
  }
  
  updateVehicleCount();
};

// Make functions globally available
window.clearFilters = clearFilters;

// Initialize filters when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (safeQuery('.vehicle-grid')) {
    initializeInventory();
    
    // Add event listeners to filter controls
    const priceFilter = safeQuery('#priceFilter');
    const typeFilter = safeQuery('#typeFilter');
    const fuelFilter = safeQuery('#fuelFilter');
    const sortBy = safeQuery('#sortBy');
    
    [priceFilter, typeFilter, fuelFilter, sortBy].forEach(element => {
      if (element) {
        element.addEventListener('change', debounce(applyFilters, 300));
      }
    });
  }
});

// =========================
// LOAD MORE FUNCTIONALITY
// =========================

const loadMoreVehicles = () => {
  const loadMoreBtn = safeQuery('.load-more');
  if (loadMoreBtn) {
    loadMoreBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading...';
    loadMoreBtn.disabled = true;
    
    // Simulate loading more vehicles
    setTimeout(() => {
      loadMoreBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Load More Vehicles';
      loadMoreBtn.disabled = false;
      
      // In a real application, you would fetch more data here
      console.log('Loading more vehicles...');
    }, 1500);
  }
};

window.loadMoreVehicles = loadMoreVehicles;

// =========================
// RESPONSIVE IMAGE LOADING
// =========================

// Lazy loading for images
const observerOptions = {
  threshold: 0.1,
  rootMargin: '50px'
};

const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    }
  });
}, observerOptions);

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', () => {
  const lazyImages = safeQueryAll('img[data-src]');
  lazyImages.forEach(img => imageObserver.observe(img));
});

// =========================
// SMOOTH SCROLLING
// =========================

document.addEventListener('DOMContentLoaded', () => {
  const scrollLinks = safeQueryAll('a[href^="#"]');
  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      const targetElement = safeQuery(targetId);
      
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// =========================
// PERFORMANCE OPTIMIZATIONS
// =========================

// Optimize scroll events
let ticking = false;
const handleScroll = () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      // Add scroll-based functionality here
      ticking = false;
    });
    ticking = true;
  }
};

window.addEventListener('scroll', handleScroll, { passive: true });

// Optimize resize events
const handleResize = debounce(() => {
  // Handle responsive adjustments
  if (window.innerWidth > 768 && navLinks) {
    navLinks.classList.remove('active');
    document.body.classList.remove('menu-open');
    if (menuIcon) {
      menuIcon.classList.remove('active');
      menuIcon.setAttribute('aria-expanded', 'false');
    }
  }
}, 250);

window.addEventListener('resize', handleResize);

// =========================
// ERROR HANDLING
// =========================

// Global error handler
window.addEventListener('error', (e) => {
  console.error('JavaScript error:', e.error);
  // You could send this to an error tracking service
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

console.log('Auto4Sale JavaScript loaded successfully');