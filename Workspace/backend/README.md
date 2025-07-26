# مركز ريان - Backend

This is a simple Node.js + Express backend with SQLite for order data and file upload support for images.

## Features
- REST API for orders (CRUD)
- Image upload and serving
- SQLite database (file-based, no server needed)

## Getting Started

1. Install dependencies:
   ```powershell
   cd backend
   npm install
   ```
2. Start the backend server:
   ```powershell
   npm start
   ```

## API Endpoints
- `GET /orders` - List all orders
- `POST /orders` - Create a new order
- `GET /orders/:id` - Get order by ID
- `PUT /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order
- `POST /upload` - Upload image file
- `GET /images/:filename` - Serve uploaded image

## Notes
- Images are saved in the `uploads/` folder.
- Order records store image filenames/paths.
