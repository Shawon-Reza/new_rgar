import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { RouterProvider } from 'react-router-dom'
import { router } from './routers/routes.jsx'
import { ToastContainer } from 'react-toastify'
import GlobalProvider from './contexts/GlobalProvider.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GlobalProvider>
        <RouterProvider router={router} />
        <ToastContainer />
      </GlobalProvider>
    </QueryClientProvider>
  </StrictMode>,
)
