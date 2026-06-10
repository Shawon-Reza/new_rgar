import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'react-toastify/dist/ReactToastify.css'
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
        <ToastContainer
          position="top-center"
          autoClose={3200}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          pauseOnHover
          draggable
          theme="light"
          className="kyro-toast-container"
          toastClassName="kyro-toast"
          bodyClassName="kyro-toast-body"
          progressClassName="kyro-toast-progress"
        />
      </GlobalProvider>
    </QueryClientProvider>
  </StrictMode>,
)
