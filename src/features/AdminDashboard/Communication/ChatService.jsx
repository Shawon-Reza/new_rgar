import { getAuthData } from "../../../config/Config";

// ........................Get Auth Token.......................... //




// ------------------ **WebSocket Connection for Chat List** ------------------ //
export const connectWebSocketForChatList = ({ onMessage, onSeen }) => {

    let token = null;
    try {
        const { accessToken } = getAuthData();
        token = accessToken;
    } catch (e) {
        console.error("Failed to get auth data:", e);
        return null; // stop if token not found
    }
    if (!token) {
        console.error("No access token found, cannot connect WebSocket");
        return null;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "wss";
    const wsUrl = `${wsProtocol}://backend.getkyroai.com/ws/rooms/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => console.log("✅ WebSocket connected for Chat List");


    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("📩 WS message:", data);

            switch (data.type) {
                case "room_list_update":
                    onMessage?.(data.message ?? data)
                    break

                case "messages_seen_update":
                    onSeen?.(data.message_ids, data.seen_by)
                    break

                default:
                    console.warn("Unknown WS event type:", data.type)
                    onMessage?.(data)
            }
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err)
        }
    };


    socket.onclose = () =>
        console.log("❌ WebSocket disconnected for Chat List");
    socket.onerror = (e) => console.error("⚠️ WebSocket error", e);

    return socket;
};



// ---------------------- **WebSocket Connection FUnction for Chat** ------------------------- //
export const connectWebSocketForChat = ({ roomId, onMessage, onSeen }) => {
    console.log("Rooam Id :", roomId)
    // If Room ID is not provided, do not attempt to connect and return null
    if (!roomId) {
        console.error("No roomId provided, cannot connect WebSocket for Chat");
        return null;
    }
    // ...........................Get Auth Token................................ //
    let token = null;
    try {
        const { accessToken } = getAuthData();
        token = accessToken;
    } catch (e) {
        console.error("Failed to get auth data:", e);
        return null; // stop if token not found
    }
    if (!token) {
        console.error("No access token found, cannot connect WebSocket");
        return null;
    }

    // ........................WebSocket Connecting.......................... //
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "wss";
    const wsUrl = `${wsProtocol}://backend.getkyroai.com/ws/chat/${roomId}/?token=${token}`;
    const socket = new WebSocket(wsUrl);
    socket.onopen = () => console.log("✅ WebSocket connected for Chat List");


    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log("📩 WS message:", data);

            switch (data.type) {
                case "room_list_update":
                    onMessage?.(data.message ?? data)
                    break

                case "messages_seen_update":
                    onSeen?.(data.message_ids, data.seen_by)
                    break

                default:
                    console.warn("Unknown WS event type:", data.type)
                    onMessage?.(data)
            }
        } catch (err) {
            console.error("Failed to parse WebSocket message:", err)
        }
    };


    socket.onclose = () =>
        console.log("❌ WebSocket disconnected for Chat List");
    socket.onerror = (e) => console.error("⚠️ WebSocket error", e);

    return socket;
};



// ws://localhost:8000//ws/notifications/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzY5NDg5OTM1LCJpYXQiOjE3Njk0MDM1MzUsImp0aSI6Ijg1YmIyZjlhNzEwYzQ5MDc4ZDhiM2UxM2VlMjE4YzQ4IiwidXNlcl9pZCI6IjEwNyJ9.FanTOciLr1dF38_FHtdQGVc6auEscZ93J2-7r0SpP6o

// ---------------------- **WebSocket Connection FUnction for Notifications** ------------------------- //
export const connectWebSocketForNotifications = ({ onMessage, onSeen }) => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const reconnectDelay = 3000; // 3 seconds
    let reconnectTimeout = null;

    // ...........................Get Auth Token................................ //
    let token = null;
    try {
        const { accessToken } = getAuthData();
        token = accessToken;
    } catch (e) {
        console.error("❌ Failed to get auth data:", e);
        return null; // stop if token not found
    }
    if (!token) {
        console.error("❌ No access token found, cannot connect WebSocket");
        return null;
    }

    // ........................WebSocket Connecting.......................... //
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "wss";
    const wsUrl = `${wsProtocol}://backend.getkyroai.com/ws/notifications/?token=${token}`;

//  ws://backend.getkyroai.com/ws/notifications/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzcxNTc3MjI1LCJpYXQiOjE3NzE0OTA4MjUsImp0aSI6IjgzMzhkZjdkNmU0ZjQ3N2VhYWQ3Y2VkMjAyZjk2ZmVkIiwidXNlcl9pZCI6IjE1In0.AeIvjStz9fieYXlLaq8MpvIdORuZo3qs9aO1GKZ_k9w

    let socket = null;

    const createSocket = () => {
        try {
            socket = new WebSocket(wsUrl);
            console.log(`🔗 Creating WebSocket connection (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts + 1})...`);
        } catch (err) {
            console.error("❌ Failed to create WebSocket:", err);
            return null;
        }

        socket.onopen = () => {
            console.log("✅ WebSocket connected for Notifications");
            console.log("🔌 WebSocket readyState:", socket.readyState, "(1 = OPEN)");
            reconnectAttempts = 0; // Reset attempts on successful connection
        }

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📩 New msg from Chat Service for Notification{{{{{{{{{{{{{}}}}}}}}}}}}}}}", data);

                // ================ Pass new notification data to handler ==================\\
                onMessage?.(data);

            } catch (err) {
                console.error("❌ Failed to parse WebSocket message:", err)
                console.error("Raw event data:", event.data)
            }
        };

        socket.onclose = (event) => {
            console.log("❌ WebSocket disconnected for Notifications");
            console.log("🔌 Close code:", event.code, "| Reason:", event.reason || "No reason provided");
            console.log("🔌 WebSocket readyState:", socket.readyState, "(3 = CLOSED)");

            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts < maxReconnectAttempts) {
                const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
                reconnectAttempts++;
                console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})...`);

                reconnectTimeout = setTimeout(() => {
                    console.log("🔗 Retrying WebSocket connection...");
                    createSocket();
                }, delay);
            } else {
                console.error("❌ Max reconnection attempts reached. Giving up.");
            }
        };

        socket.onerror = (e) => {
            console.error("⚠️ WebSocket error occurred");
            console.error("Error type:", e.type);
            console.error("Error target readyState:", e.target?.readyState, "(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)");

            // Analyze error type
            if (e.target?.readyState === 3) {
                console.error("❌ Connection failed or was closed");
                console.error("This could be due to:");
                console.error("  - Server at 10.10.13.2:8000 is not accessible");
                console.error("  - Network connectivity issue");
                console.error("  - Firewall or proxy blocking WebSocket connections");
                console.error("  - Invalid authentication token");
                console.error("  - CORS or WebSocket protocol issue on server side");
            }

            console.error("Full error object:", {
                type: e.type,
                isTrusted: e.isTrusted,
                targetUrl: e.target?.url
            });
        };

        return socket;
    };

    // Create initial socket connection
    createSocket();

    // Return object with close method for cleanup
    return {
        close: () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
                console.log("🔌 Cleared reconnection timeout");
            }
            if (socket && socket.readyState === 1) {
                socket.close();
                console.log("🔌 WebSocket closed by user");
            }
        },
        getReadyState: () => socket?.readyState,
        getUrl: () => socket?.url
    };
};
