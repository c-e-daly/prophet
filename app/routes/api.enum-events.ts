import { addSSEConnection, removeSSEConnection } from "../lib/enumBroadcast.server";

export async function loader({ request }: { request: Request }) {
  const stream = new ReadableStream({
    start(controller) {
      const textEncoder = new TextEncoder();
      
      // Create a writer for this connection
      const writer = {
        write: async (chunk: Uint8Array) => {
          controller.enqueue(chunk);
        }
      } as WritableStreamDefaultWriter;
      
      // Add connection to our set
      addSSEConnection(writer);
      
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`;
      controller.enqueue(textEncoder.encode(initialMessage));
      
      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        try {
          const heartbeatMessage = `data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`;
          controller.enqueue(textEncoder.encode(heartbeatMessage));
        } catch (error) {
          clearInterval(heartbeat);
          removeSSEConnection(writer);
          controller.close();
        }
      }, 30000); // 30 seconds
      
      // Cleanup on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        removeSSEConnection(writer);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}