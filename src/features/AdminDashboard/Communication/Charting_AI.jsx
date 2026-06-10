import { useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import ChatPanel from './ChatPanel'
import axiosApi from '../../../service/axiosInstance'

const Charting_AI = () => {
    // Create AI Charting Room mutation
    const createAiChartingRoomMutation = useMutation({
        mutationFn: async () => {
            const response = await axiosApi.post('/api/v1/rooms/ai_charting/me/')
            return response.data
        },
       
        onError: (error) => {
            console.error('[Charting_AI] Error creating/fetching room:', error)
        }
    })


    // Call the mutation on component mount
    useEffect(() => {
        createAiChartingRoomMutation.mutate()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Log mutation data if available

    // Show loading state
    if (createAiChartingRoomMutation.isPending) {
        return (
            <div className="flex h-[calc(100vh-1.75rem)] items-center justify-center">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#2B76F4]"></div>
                    <p className="text-sm font-medium text-gray-600">Creating AI Charting room...</p>
                </div>
            </div>
        )
    }

    // Show error state
    if (createAiChartingRoomMutation.isError) {
        return (
            <div className="flex h-[calc(100vh-1.75rem)] items-center justify-center">
                <div className="text-center">
                    <p className="mb-4 text-sm font-medium text-red-600">Failed to create AI Charting room</p>
                    <button
                        onClick={() => createAiChartingRoomMutation.mutate()}
                        className="rounded-lg bg-[#2B76F4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1f68e8]"
                    >
                        Retry
                    </button>
                </div>
            </div>
        )
    }

    // Only render ChatPanel when data is available
    if (!createAiChartingRoomMutation.data) {
        return null
    }

    return (
        <section className="h-full">
            <ChatPanel
                chatRoom={createAiChartingRoomMutation.data.room_id}
                roomType={createAiChartingRoomMutation.data.type}
            />
        </section>
    )
}

export default Charting_AI
