// app/lib/enumBroadcast.server.ts
// Simple in-memory store for SSE connections
const sseConnections = new Set<WritableStreamDefaultWriter>();

export function addSSEConnection(writer: WritableStreamDefaultWriter) {
  sseConnections.add(writer);
}

export function removeSSEConnection(writer: WritableStreamDefaultWriter) {
  sseConnections.delete(writer);
}

export async function broadcastEnumChange() {
  const message = `data: ${JSON.stringify({ type: 'enum_changed', timestamp: Date.now() })}\n\n`;
  
  for (const writer of sseConnections) {
    try {
      await writer.write(new TextEncoder().encode(message));
    } catch (error) {
      // Remove dead connections
      sseConnections.delete(writer);
    }
  }
}
