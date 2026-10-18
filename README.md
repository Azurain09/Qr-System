# QR System - Frontend

Web application for managing hotel breakfast orders through QR access. Guests can submit an order, while kitchen, reception, and management teams use separate authenticated views for operations and reporting.

## Highlights

- Guest QR ordering experience for breakfast and extras.
- Role-based staff interfaces for kitchen, reception, and management.
- Real-time status updates through WebSockets.
- Operational reporting and Excel export.
- Responsive React interface with Vite and Lucide icons.

## Stack

- React 19
- Vite
- JavaScript
- WebSocket API integration

## Local setup

```powershell
npm install
Copy-Item .env.example .env
# Set VITE_API_URL in .env to the local backend API URL.
npm run dev
```

The default backend address is `http://localhost:8000/api` when `VITE_API_URL` is not configured.

## Security notes

- Do not commit `.env` or `.env.local` files.
- The project intentionally does not document internal staff routes or real credentials.
- Use a separate demo environment and synthetic data when presenting the project.

## Portfolio context

This repository demonstrates the client side of a full-stack operational system: user flows, role-aware views, API integration, real-time UI updates, and reporting workflows.
