/**
 * Alert Component
 * Status messages and notifications
 */

export function Alert({ type = 'info', title, message }) {
  const types = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      message: 'text-green-700',
      iconPath: 'M5 13l4 4L19 7'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      message: 'text-red-700',
      iconPath: 'M6 18L18 6M6 6l12 12'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      message: 'text-yellow-700',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      message: 'text-blue-700',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    }
  };
  
  const config = types[type];
  
  return `
    <div class="${config.bg} border ${config.border} rounded-lg p-4 flex items-start space-x-3">
      <svg class="w-5 h-5 ${config.icon} flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${config.iconPath}"></path>
      </svg>
      <div class="flex-1">
        <h4 class="font-semibold ${config.title}">${title}</h4>
        <p class="${config.message} text-sm">${message}</p>
      </div>
    </div>
  `;
}
