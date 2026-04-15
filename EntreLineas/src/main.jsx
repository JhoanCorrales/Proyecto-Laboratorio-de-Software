import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Home from './Home.jsx'
import { RouterProvider } from 'react-router-dom'
import { createBrowserRouter } from 'react-router-dom'

import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import EditProfile from './pages/EditProfile.jsx'
import Catalogue from './pages/Catalogue.jsx'
import BookDetail from './pages/BookDetail.jsx'
import Categories from './pages/Categories.jsx'
import Cart from './pages/Cart.jsx'
import RoleManagement from './pages/RoleManagement.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />, 
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/profile/edit",
    element: (
      <ProtectedRoute>
        <EditProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: "/catalogue",
    element: <Catalogue />,
  },
  {
    path: "/catalogue/:bookTitle/details",
    element: <BookDetail />,
  },
  {
    path: "/categories",
    element: <Categories />,
  },
  {
    path: "/cart",
    element: (
      <ProtectedRoute>
        <Cart />
      </ProtectedRoute>
    ),
  },
  {
    path: "/role-management",
    element: (
      <ProtectedRoute requiredRole="Root">
        <RoleManagement />
      </ProtectedRoute>
    ),
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
