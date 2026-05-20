import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/leaflet-custom.css'
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
import Checkout from './pages/Checkout.jsx'
import PurchaseHistory from './pages/PurchaseHistory.jsx'
import RoleManagement from './pages/RoleManagement.jsx'
import AddPaymentMethod from './pages/AddPaymentMethod.jsx'
import Wallet from './pages/Wallet.jsx'
import StoresPage from './pages/StoresPage.jsx'
import StoreInventoryPage from './pages/StoreInventoryPage.jsx'
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
    path: "/catalogue/book/:bookId",
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
    path: "/checkout",
    element: (
      <ProtectedRoute>
        <Checkout />
      </ProtectedRoute>
    ),
  },
  {
    path: "/purchases",
    element: (
      <ProtectedRoute>
        <PurchaseHistory />
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
  },
  {
    path: "/add-payment",
    element: (
      <ProtectedRoute>
        <AddPaymentMethod />
      </ProtectedRoute>
    ),
  },
  {
    path: "/wallet",
    element: (
      <ProtectedRoute excludeRoles={["Root", "Administrador"]}>
        <Wallet />
      </ProtectedRoute>
    ),
  },
  {
    path: "/stores",
    element: (
      <ProtectedRoute requiredRole="Administrador">
        <StoresPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/store-inventory/:storeId",
    element: (
      <ProtectedRoute requiredRole="Administrador">
        <StoreInventoryPage />
      </ProtectedRoute>
    ),
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
