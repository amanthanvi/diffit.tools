import { TRPCError } from '@trpc/server';
import type { Context, WSMessage } from '../types';

// In-memory storage for WebSocket connections (use Redis in production)
const connections = new Map<string, Set<WebSocket>>();
const diffConnections = new Map<string, Set<string>>();

/**
 * WebSocket connection handler
 */
export class WebSocketManager {
  private ws: WebSocket;
  private diffId?: string;
  private connectionId: string;

  constructor(ws: WebSocket, connectionId: string) {
    this.ws = ws;
    this.connectionId = connectionId;
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(message: WSMessage) {
    switch (message.type) {
      case 'join':
        await this.handleJoin(message.data.diffId);
        break;

      case 'leave':
        await this.handleLeave();
        break;

      case 'cursor':
        await this.handleCursorUpdate(message.data);
        break;

      case 'selection':
        await this.handleSelectionUpdate(message.data);
        break;

      case 'ping':
        this.send({ type: 'pong', data: {} });
        break;

      default:
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Unknown message type: ${message.type}`,
        });
    }
  }

  /**
   * Join a diff room
   */
  private async handleJoin(diffId: string) {
    // Leave current diff if any
    if (this.diffId) {
      await this.handleLeave();
    }

    this.diffId = diffId;

    // Add connection to diff room
    if (!connections.has(diffId)) {
      connections.set(diffId, new Set());
    }
    connections.get(diffId)!.add(this.ws);

    // Track connection
    if (!diffConnections.has(diffId)) {
      diffConnections.set(diffId, new Set());
    }
    diffConnections.get(diffId)!.add(this.connectionId);

    // Notify others in the room
    this.broadcast({
      type: 'user_joined',
      data: {
        connectionId: this.connectionId,
        timestamp: new Date().toISOString(),
      },
    });

    // Send current users in room
    const activeUsers = Array.from(diffConnections.get(diffId) || []);
    this.send({
      type: 'room_state',
      data: {
        diffId,
        activeUsers,
      },
    });
  }

  /**
   * Leave current diff room
   */
  private async handleLeave() {
    if (!this.diffId) return;

    // Remove from connections
    const diffConns = connections.get(this.diffId);
    if (diffConns) {
      diffConns.delete(this.ws);
      if (diffConns.size === 0) {
        connections.delete(this.diffId);
      }
    }

    // Remove from diff connections
    const diffUsers = diffConnections.get(this.diffId);
    if (diffUsers) {
      diffUsers.delete(this.connectionId);
      if (diffUsers.size === 0) {
        diffConnections.delete(this.diffId);
      }
    }

    // Notify others
    this.broadcast({
      type: 'user_left',
      data: {
        connectionId: this.connectionId,
        timestamp: new Date().toISOString(),
      },
    });

    this.diffId = undefined;
  }

  /**
   * Handle cursor position update
   */
  private async handleCursorUpdate(data: any) {
    if (!this.diffId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Not in a diff room',
      });
    }

    this.broadcast({
      type: 'cursor_update',
      data: {
        connectionId: this.connectionId,
        ...data,
      },
    });
  }

  /**
   * Handle text selection update
   */
  private async handleSelectionUpdate(data: any) {
    if (!this.diffId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Not in a diff room',
      });
    }

    this.broadcast({
      type: 'selection_update',
      data: {
        connectionId: this.connectionId,
        ...data,
      },
    });
  }

  /**
   * Send message to current connection
   */
  private send(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connections in the same diff
   */
  private broadcast(message: any) {
    if (!this.diffId) return;

    const diffConns = connections.get(this.diffId);
    if (!diffConns) return;

    const messageStr = JSON.stringify(message);
    diffConns.forEach(ws => {
      if (ws !== this.ws && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  /**
   * Clean up connection
   */
  async cleanup() {
    await this.handleLeave();
  }
}

/**
 * Broadcast a message to all connections viewing a specific diff
 */
export function broadcastToDiff(diffId: string, message: any) {
  const diffConns = connections.get(diffId);
  if (!diffConns) return;

  const messageStr = JSON.stringify(message);
  diffConns.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

/**
 * Get active users for a diff
 */
export function getActiveDiffUsers(diffId: string): string[] {
  return Array.from(diffConnections.get(diffId) || []);
}