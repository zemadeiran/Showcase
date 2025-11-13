import { readItems, createItem, updateItem, deleteItem } from './db.js';

export function handleApiRequest(req, res, url) {
  if (url.pathname === '/api/items') {
    if (req.method === 'GET') {
      // Get all items
      const items = readItems();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(items));

    } else if (req.method === 'POST') {
      // Add new item
      let body = '';
      req.on('data', (chunk) => body += chunk);
      req.on('end', () => {
        try {
          const { title, description } = JSON.parse(body);
          const id = createItem(title, description);
          
          if (id) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ id }));
          } else {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to create item' }));
          }
        } catch (error) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });

    } else if (req.method === 'PUT') {
      // Update item
      const id = parseInt(url.searchParams.get('id'));
      if (id) {
        let body = '';
        req.on('data', (chunk) => body += chunk);
        req.on('end', () => {
          try {
            const { title, description } = JSON.parse(body);
            const success = updateItem(id, title, description);
            if (success) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true }));
            } else {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Failed to update item' }));
            }
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid JSON' }));
          }
        });
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ID required' }));
      }

    } else if (req.method === 'DELETE') {
      // Delete item
      const id = parseInt(url.searchParams.get('id'));
      if (id) {
        const success = deleteItem(id);
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to delete item' }));
        }
      } else {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'ID required' }));
      }
    }

    return true;
  }

  return false;
}
