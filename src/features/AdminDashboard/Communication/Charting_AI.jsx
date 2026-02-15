import React, { useEffect } from 'react'
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
        onSuccess: (data) => {
            console.log('[Charting_AI] Room created/fetched successfully:', data)
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
    console.log('[Charting_AI] Mutation data==============================::::::', createAiChartingRoomMutation.data)

    // Show loading state
    if (createAiChartingRoomMutation.isPending) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Creating AI Charting room...</p>
                </div>
            </div>
        )
    }

    // Show error state
    if (createAiChartingRoomMutation.isError) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Failed to create AI Charting room</p>
                    <button
                        onClick={() => createAiChartingRoomMutation.mutate()}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
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
        <div>
            {/* ========================= Chat Panel FFor Charting AI ======================== */}
            {/*  chatRoom, roomType */}
            <section className=''>
                <ChatPanel
                    chatRoom={createAiChartingRoomMutation.data.room_id}
                    roomType={createAiChartingRoomMutation.data.type}
                />
            </section>

        </div>
    )
}

export default Charting_AI