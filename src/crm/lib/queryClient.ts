import { QueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import axios from 'axios'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        let message = 'Une erreur est survenue'
        if (axios.isAxiosError(error) && error.response?.data) {
          const data = error.response.data as { error?: string; message?: string }
          message = data.error || data.message || message
        } else if (error instanceof Error) {
          message = error.message
        }
        toast.error(message)
      },
    },
  },
})
