import { getAuthData } from "../../../config/Config";

// ........................Get Auth Token.......................... //

// ------------------ **WebSocket Connection for Chat List** ------------------ //
export const connectWebSocketForChatList = ({ onMessage, onSeen }) => {
  let token = null;
  try {
    const { accessToken } = getAuthData();
    token = accessToken;
  } catch (e) {
    return null; // stop if token not found
  }
  if (!token) {
    return null;
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss" : "wss";
  const wsUrl = `${wsProtocol}://backend.getkyroai.com/ws/rooms/?token=${token}`;
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "room_list_update":
          onMessage?.(data.message ?? data);
          break;

        case "messages_seen_update":
          onSeen?.(data.message_ids, data.seen_by);
          break;

        default:
          onMessage?.(data);
      }
    } catch (err) {}
  };

  return socket;
};

// ---------------------- **WebSocket Connection FUnction for Chat** ------------------------- //
export const connectWebSocketForChat = ({ roomId, onMessage, onSeen }) => {
  // If Room ID is not provided, do not attempt to connect and return null
  if (!roomId) {
    return null;
  }
  // ...........................Get Auth Token................................ //
  let token = null;
  try {
    const { accessToken } = getAuthData();
    token = accessToken;
  } catch (e) {
    return null; // stop if token not found
  }
  if (!token) {
    return null;
  }

  // ........................WebSocket Connecting.......................... //
  const wsProtocol = window.location.protocol === "https:" ? "wss" : "wss";
  const wsUrl = `${wsProtocol}://backend.getkyroai.com/ws/chat/${roomId}/?token=${token}`;
  const socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "room_list_update":
          onMessage?.(data.message ?? data);
          break;

        case "messages_seen_update":
          onSeen?.(data.message_ids, data.seen_by);
          break;
        case "ai_stream":

        default:
          onMessage?.(data);
      }
    } catch (err) {}
  };

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
    return null; // stop if token not found
  }
  if (!token) {
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
    } catch (err) {
      return null;
    }

    socket.onopen = () => {
      reconnectAttempts = 0; // Reset attempts on successful connection
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // ================ Pass new notification data to handler ==================\\
        onMessage?.(data);
      } catch (err) {}
    };

    socket.onclose = (event) => {
      // Attempt to reconnect with exponential backoff
      if (reconnectAttempts < maxReconnectAttempts) {
        const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
        reconnectAttempts++;

        reconnectTimeout = setTimeout(() => {
          createSocket();
        }, delay);
      }
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
      }
      if (socket && socket.readyState === 1) {
        socket.close();
      }
    },
    getReadyState: () => socket?.readyState,
    getUrl: () => socket?.url,
  };
};
