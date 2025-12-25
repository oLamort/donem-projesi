import { io } from 'socket.io-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const SOCKET_URL = API_BASE_URL.replace('/api', '');

class SocketService {
    socket = null;

    connect(token) {
        if (this.socket?.connected) return;

        this.socket = io(SOCKET_URL, {
            auth: { token },
            reconnection: true,
        });

        this.socket.on("connect", () => {
            console.log("Socket connected");
        });

        this.socket.on("connect_error", (err) => {
            console.error("Socket request failed", err);
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

const socketService = new SocketService();
export default socketService;
