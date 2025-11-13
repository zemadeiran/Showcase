/**
 * Navigation Component
 * Modern animated hamburger menu with reactive state management
 */

export class Nav extends HTMLElement {
  constructor() {
    super();
    this.isOpen = false;
    this.isLoggedIn = false;
    this.userData = null;
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.addStyles();
    this.checkAuthState();
    this.setupMobileFirst();

    // Periodically check auth state (every 30 seconds)
    this.authCheckInterval = setInterval(() => {
      this.checkAuthState();
    }, 30000);
  }

  setupMobileFirst() {
    // Add mobile-first utilities
    this.isMobile = window.innerWidth < 768;
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Listen for viewport changes
    window.addEventListener('resize', () => {
      const wasMobile = this.isMobile;
      this.isMobile = window.innerWidth < 768;

      // If transitioning from mobile to desktop or vice versa, update menu
      if (wasMobile !== this.isMobile) {
        this.updateMenuVisibility();
      }
    });
  }

  disconnectedCallback() {
    // Clean up interval when component is removed
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }
  }

  addStyles() {
    if (!document.getElementById('nav-menu-styles')) {
      const style = document.createElement('style');
      style.id = 'nav-menu-styles';
      style.textContent = `
        @keyframes menuSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes hamburgerRotate {
          0% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes crossLine1 {
          from { transform: rotate(0deg); }
          to { transform: rotate(45deg) translate(5px, 5px); }
        }

        @keyframes crossLine2 {
          from { transform: rotate(0deg); }
          to { transform: rotate(-45deg) translate(7px, -6px); }
        }

        .menu-enter {
          animation: menuSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hamburger-rotate {
          animation: hamburgerRotate 0.6s ease-in-out;
        }

        .line1-cross {
          animation: crossLine1 0.3s ease-in-out forwards;
        }

        .line2-cross {
          animation: crossLine2 0.3s ease-in-out forwards;
        }

        .line1-back {
          animation: crossLine1 0.3s ease-in-out reverse;
        }

        .line2-back {
          animation: crossLine2 0.3s ease-in-out reverse;
        }

        .menu-backdrop {
          backdrop-filter: blur(8px);
          background: rgba(0, 0, 0, 0.5);
        }

        .nav-hidden {
          display: none !important;
        }

        /* Mobile-first touch enhancements */
        @media (max-width: 767px) {
          .nav-item {
            -webkit-tap-highlight-color: rgba(0,0,0,0.1);
            touch-action: manipulation;
          }

          .mobile-menu-enter {
            animation: menuSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }

          /* Prevent horizontal scroll on mobile menu */
          .mobile-menu-content {
            overscroll-behavior: contain;
          }
        }

        /* Desktop enhancements */
        @media (min-width: 768px) {
          .nav-item:hover {
            transform: translateY(-1px);
          }

          .user-menu-button:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }
        }

        .nav-item {
          position: relative;
          overflow: hidden;
        }

        .nav-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s;
        }

        .nav-item:hover::before {
          left: 100%;
        }
      `;
      document.head.appendChild(style);
    }
  }

  checkAuthState() {
    // Check authentication via API instead of localStorage
    fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'same-origin' // Important for cookies
    })
    .then(response => response.json())
    .then(data => {
      if (data && !data.error) {
        this.isLoggedIn = true;
        this.userData = data;
        this.updateUserMenu();
      } else {
        this.isLoggedIn = false;
        this.userData = null;
      }
      this.updateMenuVisibility();
    })
    .catch(error => {
      console.error('Auth check failed:', error);
      this.isLoggedIn = false;
      this.userData = null;
      this.updateMenuVisibility();
    });
  }

  updateUserMenu() {
    if (!this.isLoggedIn || !this.userData) return;

    const userInitial = this.querySelector('#user-initial');
    const userName = this.querySelector('#user-name');
    const userEmail = this.querySelector('#user-email');

    if (userInitial) {
      userInitial.textContent = this.userData.name?.charAt(0).toUpperCase() || 'U';
    }
    if (userName) {
      userName.textContent = this.userData.name || 'User';
    }
    if (userEmail) {
      userEmail.textContent = this.userData.email || '';
    }
  }

  updateMenuVisibility() {
    const authButtons = this.querySelector('#auth-buttons');
    const userMenu = this.querySelector('#user-menu');
    const desktopMenu = this.querySelector('#desktop-menu');
    const mobileAuthButtons = this.querySelector('#mobile-auth-buttons');

    if (this.isLoggedIn) {
      // Show user menu, hide auth buttons, keep main nav visible
      authButtons?.classList.add('nav-hidden');
      mobileAuthButtons?.classList.add('hidden');
      userMenu?.classList.remove('nav-hidden');

      // Update mobile menu content to show user menu
      this.updateMobileMenuContent(true);
    } else {
      // Show auth buttons, hide user menu, keep main nav visible
      authButtons?.classList.remove('nav-hidden');
      mobileAuthButtons?.classList.remove('hidden');
      userMenu?.classList.add('nav-hidden');

      // Update mobile menu content to show auth buttons
      this.updateMobileMenuContent(false);
    }
  }

  updateMobileMenuContent(showUserMenu) {
    const mobileMenu = this.querySelector('#mobile-menu');
    if (!mobileMenu) return;

    const existingUserMenu = mobileMenu.querySelector('#mobile-user-menu-content');
    const existingAuthButtons = mobileMenu.querySelector('#mobile-auth-buttons');

    if (showUserMenu && this.userData) {
      // Remove auth buttons and add user menu
      if (existingAuthButtons) {
        existingAuthButtons.remove();
      }
      if (!existingUserMenu) {
        const userMenuHTML = this.renderMobileUserMenu();
        const mobileContent = mobileMenu.querySelector('.mobile-menu-content');
        if (mobileContent) {
          mobileContent.insertAdjacentHTML('beforeend', userMenuHTML);
          // Attach event listeners to the newly added content
          this.attachMobileMenuEventListeners();
        }
      }
    } else {
      // Remove user menu and add auth buttons
      if (existingUserMenu) {
        existingUserMenu.remove();
      }
      if (!existingAuthButtons) {
        const authButtonsHTML = `
          <div id="mobile-auth-buttons" class="border-t border-gray-200 mt-auto p-4 space-y-3">
            <a href="/login" class="nav-item block w-full px-4 py-3 text-center text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-300">
              Sign In
            </a>
            <a href="/register" class="nav-item block w-full px-4 py-3 text-center bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg transition-all">
              Sign Up
            </a>
          </div>
        `;
        const mobileContent = mobileMenu.querySelector('.mobile-menu-content');
        if (mobileContent) {
          mobileContent.insertAdjacentHTML('beforeend', authButtonsHTML);
        }
      }
    }
  }

  logout() {
    // Use the auth.js logout function for consistency
    if (window.auth && window.auth.logout) {
      window.auth.logout();
    } else {
      // Fallback to direct API call
      fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
      .then(() => {
        this.isLoggedIn = false;
        this.userData = null;
        this.updateMenuVisibility();
        window.location.href = '/';
      })
      .catch(error => {
        console.error('Logout failed:', error);
        window.location.href = '/';
      });
    }
  }

  render() {
    this.innerHTML = `
      <nav class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <a href="/" class="flex items-center space-x-2 group">
            <div class="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <icon-component name="lightning" class="w-6 h-6 text-white"></icon-component>
            </div>
            <h1 class="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors hidden sm:block">Modern Web App</h1>
          </a>

          <!-- Desktop Menu -->
          <div id="desktop-menu" class="hidden md:flex items-center space-x-1">
            ${this.renderDesktopMenu()}
          </div>

          <!-- User Menu Desktop -->
          <div id="user-menu" class="hidden md:flex items-center relative">
            <button id="user-menu-button" class="user-menu-button flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-all">
              <div class="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-semibold">
                <span id="user-initial">U</span>
              </div>
              <svg id="user-chevron" class="w-4 h-4 text-gray-600 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>

            <!-- User Dropdown -->
            <div id="user-dropdown" class="hidden absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden menu-enter z-50">
              <!-- User Info -->
              <div class="px-4 py-3 bg-gradient-to-r from-primary to-secondary text-white">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <span id="user-initial-dropdown" class="font-semibold">U</span>
                  </div>
                  <div>
                    <div id="user-name" class="font-semibold">User</div>
                    <div id="user-email" class="text-sm opacity-90">user@example.com</div>
                  </div>
                </div>
              </div>

              <!-- Menu Items -->
              <div class="py-2">
                <a href="/profile" class="nav-item block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center space-x-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>Profile</span>
                  </div>
                </a>

                <a href="/dashboard" class="nav-item block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center space-x-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                    <span>Dashboard</span>
                  </div>
                </a>

                <a href="/settings" class="nav-item block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                  <div class="flex items-center space-x-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>Settings</span>
                  </div>
                </a>
              </div>

              <hr class="border-gray-200">

              <div class="py-2">
                <button id="logout-button" class="nav-item w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors">
                  <div class="flex items-center space-x-3">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                    </svg>
                    <span>Sign Out</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Auth Buttons (shown when not logged in) -->
          <div id="auth-buttons" class="hidden md:flex items-center space-x-2">
            <a href="/login" class="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all font-medium">
              Sign In
            </a>
            <a href="/register" class="px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all">
              Sign Up
            </a>
          </div>

          <!-- Hamburger Menu Button -->
          <button id="hamburger-button" class="md:hidden relative w-10 h-10 rounded-lg hover:bg-gray-100 transition-all focus:outline-none">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="w-5 h-5 relative">
                <span id="line1" class="absolute top-0 left-0 w-full h-0.5 bg-gray-900 transition-all duration-300"></span>
                <span id="line2" class="absolute top-2 left-0 w-full h-0.5 bg-gray-900 transition-all duration-300"></span>
                <span id="line3" class="absolute bottom-0 left-0 w-full h-0.5 bg-gray-900 transition-all duration-300"></span>
              </div>
            </div>
          </button>
        </div>

        <!-- Mobile Menu Overlay -->
        <div id="menu-overlay" class="fixed inset-0 menu-backdrop opacity-0 pointer-events-none transition-opacity duration-300 md:hidden z-40"></div>

        <!-- Mobile Menu -->
        <div id="mobile-menu" class="fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform translate-x-full transition-transform duration-300 ease-in-out md:hidden z-50">
          <div class="flex flex-col h-full">
            <!-- Mobile Header -->
            <div class="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 class="text-lg font-semibold text-gray-900">Menu</h2>
              <button id="close-mobile-menu" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <!-- Mobile Menu Content -->
            <div class="mobile-menu-content flex-1 overflow-y-auto">
              <!-- Navigation Links (always shown) -->
              <div class="py-2">
                <a href="/" class="nav-item flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  <span>Home</span>
                </a>

                <a href="/about" class="nav-item flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span>About</span>
                </a>

                <a href="/contact" class="nav-item flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-primary">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <span>Contact</span>
                </a>
              </div>

              <!-- Auth Buttons (when not logged in) - handled dynamically -->
            </div>
          </div>
        </div>
      </nav>
    `;
  }

  renderDesktopMenu() {
    return `
      <a href="/" class="nav-link px-3 py-2 text-gray-700 hover:text-primary rounded-lg transition-colors font-medium">
        Home
      </a>
      <a href="/about" class="nav-link px-3 py-2 text-gray-700 hover:text-primary rounded-lg transition-colors font-medium">
        About
      </a>
      <a href="/contact" class="nav-link px-3 py-2 text-gray-700 hover:text-primary rounded-lg transition-colors font-medium">
        Contact
      </a>
    `;
  }

  attachMobileMenuEventListeners() {
    const mobileMenu = this.querySelector('#mobile-menu');
    if (!mobileMenu) return;

    const mobileLogoutButton = mobileMenu.querySelector('#mobile-logout-button');
    if (mobileLogoutButton) {
      mobileLogoutButton.addEventListener('click', () => {
        this.logout();
        // Close mobile menu after logout
        this.setState({ isOpen: false });
      });
    }
  }

  attachEventListeners() {
    // Hamburger menu
    const hamburgerButton = this.querySelector('#hamburger-button');
    const mobileMenu = this.querySelector('#mobile-menu');
    const menuOverlay = this.querySelector('#menu-overlay');
    const closeButton = this.querySelector('#close-mobile-menu');
    const line1 = this.querySelector('#line1');
    const line2 = this.querySelector('#line2');
    const line3 = this.querySelector('#line3');

    const toggleMenu = () => {
      this.isOpen = !this.isOpen;

      if (this.isOpen) {
        // Open menu
        mobileMenu.classList.remove('translate-x-full');
        menuOverlay.classList.remove('pointer-events-none');
        menuOverlay.classList.remove('opacity-0');
        menuOverlay.classList.add('opacity-100');

        // Animate hamburger to X
        line1.classList.add('line1-cross');
        line3.classList.add('line2-cross');
        line2.classList.add('opacity-0');
      } else {
        // Close menu
        mobileMenu.classList.add('translate-x-full');
        menuOverlay.classList.add('pointer-events-none');
        menuOverlay.classList.add('opacity-0');
        menuOverlay.classList.remove('opacity-100');

        // Animate X back to hamburger
        line1.classList.remove('line1-cross');
        line3.classList.remove('line2-cross');
        line2.classList.remove('opacity-0');
      }
    };

    hamburgerButton?.addEventListener('click', toggleMenu);
    closeButton?.addEventListener('click', toggleMenu);
    menuOverlay?.addEventListener('click', toggleMenu);

    // User dropdown (desktop)
    const userMenuButton = this.querySelector('#user-menu-button');
    const userDropdown = this.querySelector('#user-dropdown');
    const userChevron = this.querySelector('#user-chevron');

    userMenuButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = !userDropdown.classList.contains('hidden');

      if (isVisible) {
        userDropdown.classList.add('hidden');
        userChevron.classList.remove('rotate-180');
      } else {
        userDropdown.classList.remove('hidden');
        userChevron.classList.add('rotate-180');
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!userMenuButton?.contains(e.target)) {
        userDropdown?.classList.add('hidden');
        userChevron?.classList.remove('rotate-180');
      }
    });

    // Logout buttons
    const logoutButton = this.querySelector('#logout-button');
    const mobileLogoutButton = this.querySelector('#mobile-logout-button');

    const handleLogout = () => {
      this.logout();
      // Close menus
      if (this.isOpen) toggleMenu();
      userDropdown?.classList.add('hidden');
      userChevron?.classList.remove('rotate-180');
    };

    logoutButton?.addEventListener('click', handleLogout);
    // Note: mobileLogoutButton is now handled by attachMobileMenuEventListeners()
  }

  renderMobileUserMenu() {
    return `
      <!-- User Info Section -->
      <div class="px-4 py-4 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div class="flex items-center space-x-3">
          <div class="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-semibold text-lg">
            ${this.userData.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <div class="font-semibold text-gray-900">${this.userData.name || 'User'}</div>
            <div class="text-sm text-gray-600">${this.userData.email || ''}</div>
          </div>
        </div>
      </div>

      <!-- User Navigation Links -->
      <div class="border-t border-gray-200 mt-2 pt-2">
        <a href="/profile" class="nav-item flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          <span>Profile</span>
        </a>

        <a href="/dashboard" class="nav-item flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          <span>Dashboard</span>
        </a>

        <a href="/settings" class="nav-item flex items-center space-x-3 px-4 py-4 text-gray-700 hover:bg-gray-50 transition-colors border-l-4 border-transparent hover:border-primary">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          <span>Settings</span>
        </a>
      </div>

      <!-- Logout Button -->
      <div class="border-t border-gray-200 p-4">
        <button id="mobile-logout-button" class="nav-item w-full flex items-center justify-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span>Sign Out</span>
        </button>
      </div>
    `;
  }
}

// Register the custom element
customElements.define('nav-component', Nav);
