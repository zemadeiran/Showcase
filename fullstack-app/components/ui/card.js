/**
 * Card Component
 * Reusable card functions that return HTML strings
 */

export function Card({ title, content, variant = 'default' }) {
  const variants = {
    default: 'bg-white border border-gray-200',
    dark: 'bg-gray-900 text-white',
    hover: 'bg-white border border-gray-200 hover:shadow-lg transition-shadow'
  };
  
  return `
    <div class="${variants[variant]} rounded-xl p-6">
      ${title ? `<h3 class="text-xl font-bold ${variant === 'dark' ? 'text-white' : 'text-gray-900'} mb-2">${title}</h3>` : ''}
      <p class="${variant === 'dark' ? 'text-gray-300' : 'text-gray-600'}">${content}</p>
    </div>
  `;
}

export function FeatureCard({ icon, title, description }) {
  return `
    <div class="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
      <div class="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
        ${icon}
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-3">${title}</h3>
      <p class="text-gray-600">${description}</p>
    </div>
  `;
}
