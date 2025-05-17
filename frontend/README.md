# 🖥️ Event Booking System - Frontend

This directory contains the frontend application for the Event Booking System, built with Next.js and a modern component library.

## 🌟 Key Features

- **Modern React Architecture**: Built with Next.js App Router
- **Component Library**: Uses shadcn/ui components based on Radix UI
- **Styling**: Tailwind CSS for responsive design
- **Authentication**: Secure JWT-based auth with token refresh
- **State Management**: React Context API for global state
- **API Integration**: Custom API client with error handling
- **Form Handling**: Form validation and submission
- **Animations**: Framer Motion for smooth interactions

## 🚀 Technical Implementation

### API Integration
- Custom API wrapper for making authenticated requests
- API proxy middleware to handle CORS issues
- Token refresh mechanism to maintain sessions
- Comprehensive error handling and user feedback

### Authentication Flow
- JWT authentication with secure token storage
- Refresh token mechanism using HTTP-only cookies
- Role-based access control (Admin vs User)
- Protected routes and conditional UI rendering

### UI Components
- Modern, accessible UI built with shadcn/ui
- Responsive design that works on all device sizes
- Dark mode support with system preference detection
- Custom animations for enhanced user experience
- Toast notifications for user feedback

### Performance Optimizations
- Static site generation for fast page loads
- Image optimization with Next.js Image component
- Code splitting and lazy loading
- Edge-compatible API routes

## 🛠️ Getting Started

First, navigate to the frontend directory:

```bash
cd frontend
```

Then, install the project dependencies:

```bash
pnpm install
# or
npm install
# or
yarn install
```

Finally, run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📁 Project Structure

```
├── app/                  # Next.js App Router pages and layouts
│   ├── admin/            # Admin panel pages
│   ├── api/              # API routes, including proxy
│   ├── events/           # Event browsing and booking
│   ├── my-bookings/      # User's bookings
│   └── layout.tsx        # Root layout with providers
├── components/           # Reusable UI components
│   ├── admin/            # Admin-specific components
│   └── ui/               # UI library components
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and API clients
└── public/               # Static assets
```

## 🔧 Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

For production deployment, set this to your production API URL.

## 📱 Responsive Design

The UI is fully responsive and works on:
- Desktop displays
- Tablets
- Mobile devices

The design adapts to various screen sizes and follows modern web practices.

## 🧩 Integration with Backend

The frontend connects to the Spring Boot backend via:
- REST API calls for data fetching and mutations
- JWT authentication for secure operations
- WebSocket for real-time updates (if implemented)

## 🌙 Dark Mode Support

The application supports:
- Light mode
- Dark mode
- System preference detection

## 📦 Deployment

The frontend is configured for deployment on Vercel:

1. Push to GitHub repository
2. Connect repository to Vercel
3. Vercel will automatically build and deploy

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Radix UI Documentation](https://www.radix-ui.com)
