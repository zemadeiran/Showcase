# API Documentation

## Overview

RESTful API endpoints for managing items. All endpoints return JSON responses.

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Get All Items

Retrieve all items from the database.

**Endpoint:** `GET /api/items`

**Response:**
```json
[
  {
    "id": 1,
    "user_id": null,
    "title": "Example Item",
    "description": "Item description",
    "status": "active",
    "created_at": "2025-01-01 12:00:00",
    "updated_at": "2025-01-01 12:00:00"
  }
]
```

**Status Codes:**
- `200 OK` - Success

**Example:**
```bash
curl http://localhost:3000/api/items
```

---

### Create Item

Create a new item.

**Endpoint:** `POST /api/items`

**Request Body:**
```json
{
  "title": "New Item",
  "description": "Optional description"
}
```

**Response:**
```json
{
  "id": 2
}
```

**Status Codes:**
- `200 OK` - Item created successfully
- `400 Bad Request` - Invalid JSON
- `500 Internal Server Error` - Failed to create item

**Example:**
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"New Item","description":"Description here"}'
```

---

### Update Item

Update an existing item.

**Endpoint:** `PUT /api/items?id={id}`

**Query Parameters:**
- `id` (required) - Item ID

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Item updated successfully
- `400 Bad Request` - Missing ID or invalid JSON
- `500 Internal Server Error` - Failed to update item

**Example:**
```bash
curl -X PUT "http://localhost:3000/api/items?id=1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated Title","description":"New description"}'
```

---

### Delete Item

Delete an item.

**Endpoint:** `DELETE /api/items?id={id}`

**Query Parameters:**
- `id` (required) - Item ID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Item deleted successfully
- `400 Bad Request` - Missing ID
- `500 Internal Server Error` - Failed to delete item

**Example:**
```bash
curl -X DELETE "http://localhost:3000/api/items?id=1"
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

**Common Errors:**
- `Invalid JSON` - Request body is not valid JSON
- `ID required` - Missing required ID parameter
- `Failed to create item` - Database error during creation
- `Failed to update item` - Database error during update
- `Failed to delete item` - Database error during deletion

## CORS

CORS is enabled for all origins:

```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Rate Limiting

Currently no rate limiting is implemented. Consider adding rate limiting for production use.

## Authentication

Currently no authentication is required. To add authentication:

1. Implement session management
2. Add middleware to verify session tokens
3. Protect endpoints with authentication checks

See `utils/auth.js` for password hashing utilities.

## Future Endpoints

Potential endpoints to add:

### User Management
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update current user

### Sessions
- `GET /api/sessions` - List user sessions
- `DELETE /api/sessions/:id` - Revoke session

## Testing

Test the API using curl, Postman, or any HTTP client:

```bash
# Get all items
curl http://localhost:3000/api/items

# Create item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Item"}'

# Update item
curl -X PUT "http://localhost:3000/api/items?id=1" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'

# Delete item
curl -X DELETE "http://localhost:3000/api/items?id=1"
```
