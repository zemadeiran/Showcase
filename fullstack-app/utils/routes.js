/**
 * Routes configuration file
 * Similar to React Router v7's routes.ts
 * Defines all application routes and their metadata
 */

export const routes = [
  {
    path: '/',
    page: 'index',
    title: 'Modern Web App',
    description: 'A modern web application built with vanilla JavaScript, Node.js, and SQLite - zero dependencies, maximum performance'
  },
  {
    path: '/about',
    page: 'about',
    title: 'About Us',
    description: 'Learn more about our mission and technology'
  },
  {
    path: '/contact',
    page: 'contact',
    title: 'Contact',
    description: 'Get in touch with our team'
  },
  {
    path: '/login',
    page: 'login',
    title: 'Sign In',
    description: 'Sign in to your account'
  },
  {
    path: '/register',
    page: 'register',
    title: 'Create Account',
    description: 'Create a new account'
  },
  {
    path: '/dashboard',
    page: 'dashboard',
    title: 'Dashboard',
    description: 'Your personal dashboard'
  },
  {
    path: '/dashboard/profile',
    page: 'dashboard.profile',
    title: 'Edit Profile',
    description: 'Update your account information'
  },
  {
    path: '/dashboard/settings',
    page: 'dashboard.settings',
    title: 'Settings',
    description: 'Manage your preferences'
  },
  {
    path: '/dashboard/activity',
    page: 'dashboard.activity',
    title: 'Activity',
    description: 'View your recent activity'
  }
];

/**
 * Get route configuration by path
 * @param {string} pathname - URL pathname
 * @returns {object|null} Route configuration or null
 */
export function getRoute(pathname) {
  return routes.find(route => route.path === pathname) || null;
}

/**
 * Check if a route exists
 * @param {string} pathname - URL pathname
 * @returns {boolean}
 */
export function routeExists(pathname) {
  return routes.some(route => route.path === pathname);
}

/**
 * Get all route paths
 * @returns {string[]} Array of route paths
 */
export function getAllPaths() {
  return routes.map(route => route.path);
}
