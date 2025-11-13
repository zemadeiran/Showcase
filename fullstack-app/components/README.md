# Components

Reusable JavaScript component functions that return HTML strings.

## Why JavaScript Components?

✅ **Truly reusable** - Import and use anywhere
✅ **Dynamic** - Pass props/parameters
✅ **Type-safe** - Can add JSDoc types
✅ **Zero dependencies** - Pure JavaScript functions
✅ **Server-side** - Can be used in template rendering

## Structure

```
components/
├── ui/              # UI components
│   ├── button.js
│   ├── card.js
│   ├── alert.js
│   └── toast.js
└── README.md
```

## UI Components

### Button (`ui/button.js`)

**Functions:**
- `Button({ text, variant, size, onClick, disabled })`
- `IconButton({ icon, variant, onClick })`

**Variants:** `primary`, `secondary`, `danger`, `ghost`
**Sizes:** `small`, `medium`, `large`

**Usage:**
```javascript
import { Button, IconButton } from './components/ui/button.js';

// Primary button
const html = Button({ 
  text: 'Click Me', 
  variant: 'primary', 
  size: 'medium',
  onClick: 'handleClick()'
});

// Icon button
const iconHtml = IconButton({ 
  icon: '<svg>...</svg>',
  variant: 'primary',
  onClick: 'doSomething()'
});
```

### Card (`ui/card.js`)

**Functions:**
- `Card({ title, content, variant })`
- `FeatureCard({ icon, title, description })`

**Variants:** `default`, `dark`, `hover`

**Usage:**
```javascript
import { Card, FeatureCard } from './components/ui/card.js';

// Basic card
const html = Card({ 
  title: 'Card Title',
  content: 'Card content goes here',
  variant: 'default'
});

// Feature card with icon
const featureHtml = FeatureCard({
  icon: '<svg>...</svg>',
  title: 'Feature Name',
  description: 'Feature description'
});
```

### Alert (`ui/alert.js`)

**Function:**
- `Alert({ type, title, message })`

**Types:** `success`, `error`, `warning`, `info`

**Usage:**
```javascript
import { Alert } from './components/ui/alert.js';

const html = Alert({ 
  type: 'success',
  title: 'Success',
  message: 'Action completed successfully'
});
```

### Toast (`ui/toast.js`)

**Functions:**
- `toast.success(message, duration)`
- `toast.error(message, duration)`
- `toast.warning(message, duration)`
- `toast.info(message, duration)`
- `toast.show(message, type, duration)`

**Usage:**
```javascript
// Include in HTML
<script src="/components/ui/toast.js"></script>

// Use in your code
toast.success('Profile updated!');
toast.error('Something went wrong!');
toast.warning('Please check your input');
toast.info('New feature available');

// Custom duration (default 3000ms)
toast.success('Saved!', 5000);

// Persistent (duration = 0)
toast.error('Critical error', 0);
```

**Features:**
- Auto-dismiss with configurable duration
- Manual close button
- Smooth animations
- Stacking support
- 4 types with icons
- Top-right positioning

## Design System

### Colors

- **Primary**: Gray-900 (`#111827`)
- **Secondary**: Gray-600 (`#4B5563`)
- **Success**: Green-600 (`#059669`)
- **Error**: Red-600 (`#DC2626`)
- **Warning**: Yellow-600 (`#D97706`)
- **Info**: Blue-600 (`#2563EB`)

### Spacing

- **Small**: `px-4 py-2`
- **Medium**: `px-6 py-3`
- **Large**: `px-8 py-4`

### Border Radius

- **Small**: `rounded-lg` (8px)
- **Medium**: `rounded-xl` (12px)
- **Large**: `rounded-2xl` (16px)

### Typography

- **Heading**: `text-2xl font-bold text-gray-900`
- **Subheading**: `text-xl font-semibold text-gray-800`
- **Body**: `text-base text-gray-600`
- **Small**: `text-sm text-gray-500`

## Adding New Components

1. Create HTML file in `components/ui/`
2. Include multiple variants
3. Add usage examples
4. Update this README

## Using Components in Pages

Copy the HTML from component files into your pages:

```html
<!-- views/pages/example.html -->
<div class="container mx-auto px-4 py-16">
    <!-- Copy from ui/card.html -->
    <div class="bg-white border border-gray-200 rounded-xl p-6">
        <h3 class="text-xl font-bold text-gray-900 mb-2">My Card</h3>
        <p class="text-gray-600">Custom content here.</p>
    </div>
</div>
```

## Future Enhancements

Potential additions:
- Modal component
- Dropdown component
- Navigation component
- Badge component
- Table component
- Pagination component
- Loading spinner
- Toast notifications
