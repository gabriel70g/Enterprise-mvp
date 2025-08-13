'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client'; // Importar el cliente de Socket.IO
import { Trace } from './useTraces';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8080'; // URL base del servidor
const RECONNECT_INTERVAL = 5000; // 5 seconds

/**
 * A hook to manage a WebSocket connection for receiving traces.
 * @param onTraceReceived A callback function to be executed when a trace is received.
 */
export const useTraceSocket = (onTraceReceived: (trace: Trace) => void) => {
  // Usar el tipo Socket de socket.io-client
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // El cliente de socket.io maneja la reconexión automáticamente.
    if (socketRef.current) return; // Prevent creating multiple connections

    console.log(`Attempting to connect to Socket.IO at ${WEBSOCKET_URL}...`);
    // Conectar usando la función io() de la biblioteca cliente
    const socket = io(WEBSOCKET_URL, {
      reconnection: true,
      reconnectionDelay: RECONNECT_INTERVAL,
      transports: ['websocket'], // Preferir el transporte WebSocket
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Socket.IO connection established with id: ${socket.id}`);
    });

    // Escuchar el evento específico 'trace' emitido por el servidor
    socket.on('trace', (trace: Trace) => {
      // La data ya viene parseada como JSON por la biblioteca
      onTraceReceived(trace);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket.IO disconnected: ${reason}`);
    });

    // Función de limpieza para cerrar el socket al desmontar el componente
    return () => {
      if (socketRef.current) {
        console.log('Closing Socket.IO connection.');
        socketRef.current.disconnect();
      }
    };
  }, [onTraceReceived]);
};
