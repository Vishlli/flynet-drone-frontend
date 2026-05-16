import { io } from 'socket.io-client';

const socket = io('https://flynet-drone-backend.onrender.com', {
  autoConnect: false,
});

export default socket;