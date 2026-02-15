import { useEffect } from "react"
import ChatPanel from "../Communication/ChatPanel"
import Communication from "../Communication/Communication"
import ReactMarkdown from 'react-markdown';

const ChatRoomsSidebar = ({ roomsData, roomsLoading, roomsError, selectedRoom, onSelectRoom }) => {
    // ============ LOG SELECTED ROOM ID ============
    useEffect(() => {
        if (selectedRoom) {
            console.log('[Selected Chat Room ID]:', selectedRoom.room_id)
            console.log('[Selected Chat Room Details]:', selectedRoom)
        }
    }, [selectedRoom])
    return (
        <div className="lg:col-span-1 bg-white/60 rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                    Chat Rooms ({roomsData?.results?.length || 0})
                </h2>
            </div>

            {/* Room List */}
            <div className="divide-y divide-gray-200  overflow-y-auto">
                {roomsLoading ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        Loading rooms...
                    </div>
                ) : roomsError ? (
                    <div className="p-4 text-center text-red-500 text-sm">
                        Error loading rooms
                    </div>
                ) : roomsData?.results?.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                        No rooms found
                    </div>
                ) : (
                    roomsData?.results?.map((room) => (
                        <button
                            key={room.room_id}
                            onClick={() => onSelectRoom(room)}
                            className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-l-4 ${selectedRoom?.room_id === room.room_id
                                ? 'border-l-blue-500 bg-blue-50'
                                : 'border-l-transparent'
                                }`}
                        >
                            {/* Room Header */}
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-blue-600">
                                    {room.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Room Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-semibold text-gray-900 truncate">
                                            {room.name}
                                        </h3>
                                        <span className="text-xs bg-primary text-white px-2 py-1 rounded-full flex-shrink-0">
                                            {room.type === 'private' ? '1-1' : 'Grp'}
                                        </span>
                                    </div>

                                    {/* Last Message */}
                                    <p className="text-xs text-gray-500 mt-1 truncate">
                                        {/* {room.last_message?.text || 'No messages yet'} */}
                                        <ReactMarkdown>
                                            {room.last_message?.text || 'No messages yet'}
                                        </ReactMarkdown>

                                    </p>


                                    {/* Member Count & Time */}
                                    <div className="flex items-center justify-between gap-2 mt-2">
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            👥 {room.member_count} member{room.member_count !== 1 ? 's' : ''}
                                        </span>
                                        {room.last_message?.created_at && (
                                            <span className="text-xs text-gray-400">
                                                {new Date(room.last_message.created_at).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>

            {/*============================================= Communication Panel============================================= */}
            {/* Removed - Chat panel now displayed on the right side */}


        </div>
    )
}

export default ChatRoomsSidebar
