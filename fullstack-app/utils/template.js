import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIEWS_DIR = path.join(__dirname, '../views');

/**
 * Render a page with layout
 * @param {string} pageName - Name of the page file (without .html)
 * @param {object} data - Data to inject into template
 * @returns {string} Rendered HTML
 */
export function renderPage(pageName, data = {}) {
  try {
    // Read layout file
    const layoutPath = path.join(VIEWS_DIR, 'layout.html');
    let layout = fs.readFileSync(layoutPath, 'utf8');

    // Read page content file
    const pagePath = path.join(VIEWS_DIR, 'pages', `${pageName}.html`);
    let pageContent = '';
    
    if (fs.existsSync(pagePath)) {
      pageContent = fs.readFileSync(pagePath, 'utf8');
    } else {
      // Fallback: try to read from root views directory
      const fallbackPath = path.join(VIEWS_DIR, `${pageName}.html`);
      if (fs.existsSync(fallbackPath)) {
        pageContent = fs.readFileSync(fallbackPath, 'utf8');
      } else {
        return null;
      }
    }

    // Default data
    const templateData = {
      TITLE: data.title || 'Page',
      DESCRIPTION: data.description || 'A beautiful web application',
      CONTENT: pageContent,
      ...data
    };

    // Replace all placeholders in layout
    let rendered = layout;
    for (const [key, value] of Object.entries(templateData)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
    }

    return rendered;
  } catch (error) {
    console.error('Template rendering error:', error);
    return null;
  }
}

/**
 * Check if a page exists
 * @param {string} pageName - Name of the page file (without .html)
 * @returns {boolean}
 */
export function pageExists(pageName) {
  const pagePath = path.join(VIEWS_DIR, 'pages', `${pageName}.html`);
  const fallbackPath = path.join(VIEWS_DIR, `${pageName}.html`);
  return fs.existsSync(pagePath) || fs.existsSync(fallbackPath);
}
