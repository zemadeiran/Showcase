/**
 * Button Component
 * Reusable button functions that return HTML strings
 */

export function Button({ text, variant = 'primary', size = 'medium', onClick = '', disabled = false }) {
  const baseClasses = 'rounded-lg font-semibold transition-all';
  
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'border-2 border-gray-900 text-gray-900 hover:bg-gray-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-gray-900 hover:bg-gray-100'
  };
  
  const sizes = {
    small: 'px-4 py-2 text-sm',
    medium: 'px-6 py-3',
    large: 'px-8 py-4 text-lg'
  };
  
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const onClickAttr = onClick ? `onclick="${onClick}"` : '';
  const disabledAttr = disabled ? 'disabled' : '';
  
  return `
    <button 
      class="${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses}"
      ${onClickAttr}
      ${disabledAttr}
    >
      ${text}
    </button>
  `;
}

export function IconButton({ icon, variant = 'primary', onClick = '' }) {
  const variants = {
    primary: 'bg-gray-900 text-white hover:bg-gray-800',
    secondary: 'border-2 border-gray-900 text-gray-900 hover:bg-gray-50'
  };
  
  const onClickAttr = onClick ? `onclick="${onClick}"` : '';
  
  return `
    <button 
      class="w-10 h-10 flex items-center justify-center rounded-lg transition-all ${variants[variant]}"
      ${onClickAttr}
    >
      ${icon}
    </button>
  `;
}
