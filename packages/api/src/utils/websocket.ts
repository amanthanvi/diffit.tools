import { TRPCError } from '@trpc/server';
import type { Context, WSMessage } from '../types';
import { verifyJWT } from './auth';

// In-memory storage for WebSocket connections (use Redis in production)
const connections = new Map<string, Set<WebSocket>>();
const userConnections = new Map<string, Set<string>>();

/**
 * WebSocket connection handler
 */
export class WebSocketHandler {
  private ws: WebSocket;
  private userId?: string;
  private rooms = new Set<string>();
  
  constructor(ws: WebSocket, req: Request) {
    this.ws = ws;
    this.setupHandlers(req);
  }
  
  private async setupHandlers(req: Request) {
    // Authenticate connection
    const token = new URL(req.url).searchParams.get('token');
    if (token) {
      try {
        const payload = await verifyJWT(token);
        this.userId = payload.userId;
        
        // Track user connection
        if (!userConnections.has(this.userId)) {
          userConnections.set(this.userId, new Set());
        }
        userConnections.get(this.userId)!.add(this.ws.url);
      } catch (error) {
        this.ws.close(1008, 'Invalid authentication');
        return;
      }
    }
    
    // Set up event handlers
    this.ws.addEventListener('message', this.handleMessage.bind(this));
    this.ws.addEventListener('close', this.handleClose.bind(this));
    this.ws.addEventListener('error', this.handleError.bind(this));
    
    // Send welcome message
    this.send({
      type: 'connected',
      data: {
        userId: this.userId,
        timestamp: new Date().toISOString(),
      },
    });
  }
  
  private async handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'join':
          await this.joinRoom(message.room);
          break;
          
        case 'leave':
          await this.leaveRoom(message.room);
          break;
          
        case 'ping':
          this.send({ type: 'pong', data: message.data });
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }
  
  private handleClose() {
    // Remove from all rooms
    for (const room of this.rooms) {
      this.leaveRoom(room);
    }
    
    // Remove from user connections
    if (this.userId) {
      const userConns = userConnections.get(this.userId);
      if (userConns) {
        userConns.delete(this.ws.url);
        if (userConns.size === 0) {
          userConnections.delete(this.userId);
        }
      }
    }
  }
  
  private handleError(error: Event) {
    console.error('WebSocket error:', error);
  }
  
  private async joinRoom(room: string) {
    // Validate room access (e.g., check if user has access to diff)
    // For now, allow all authenticated users to join any room
    if (!this.userId) {
      this.send({
        type: 'error',
        data: { message: 'Authentication required to join rooms' },
      });
      return;
    }
    
    // Add to room
    if (!connections.has(room)) {
      connections.set(room, new Set());
    }
    connections.get(room)!.add(this.ws);
    this.rooms.add(room);
    
    // Notify room members
    this.broadcastToRoom(room, {
      type: 'user-joined',
      data: { userId: this.userId },
      room,
      userId: this.userId,
    }, true);
    
    // Send confirmation
    this.send({
      type: 'joined',
      data: { room },
    });
  }
  
  private async leaveRoom(room: string) {
    const roomConnections = connections.get(room);
    if (roomConnections) {
      roomConnections.delete(this.ws);
      if (roomConnections.size === 0) {
        connections.delete(room);
      }
    }
    this.rooms.delete(room);
    
    // Notify room members
    if (this.userId) {
      this.broadcastToRoom(room, {
        type: 'user-left',
        data: { userId: this.userId },
        room,
        userId: this.userId,
      }, true);
    }
    
    // Send confirmation
    this.send({
      type: 'left',
      data: { room },
    });
  }
  
  private send(message: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  private broadcastToRoom(room: string, message: WSMessage, excludeSelf = false) {
    const roomConnections = connections.get(room);
    if (!roomConnections) return;
    
    const messageStr = JSON.stringify(message);
    for (const ws of roomConnections) {
      if (excludeSelf && ws === this.ws) continue;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    }
  }
}

/**
 * Broadcast message to a room
 */
export function broadcastToRoom(room: string, message: WSMessage) {
  const roomConnections = connections.get(room);
  if (!roomConnections) return;
  
  const messageStr = JSON.stringify(message);
  for (const ws of roomConnections) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  }
}

/**
 * Send message to specific user
 */
export function sendToUser(userId: string, message: any) {
  const userConns = userConnections.get(userId);
  if (!userConns) return;
  
  const messageStr = JSON.stringify(message);
  for (const url of userConns) {
    // Find WebSocket by URL
    for (const [_, roomConns] of connections) {
      for (const ws of roomConns) {
        if (ws.url === url && ws.readyState === WebSocket.OPEN) {
          ws.send(messageStr);
        }
      }
    }
  }
}

/**
 * Get users in a room
 */
export function getRoomUsers(room: string): string[] {
  const users = new Set<string>();
  const roomConnections = connections.get(room);
  
  if (roomConnections) {
    for (const ws of roomConnections) {
      // Extract user ID from WebSocket URL or metadata
      // This is a simplified version
      const userId = 'user-id'; // In production, track this properly
      if (userId) users.add(userId);
    }
  }
  
  return Array.from(users);
}

/**
 * Get number of connections in a room
 */
export function getRoomConnectionCount(room: string): number {
  return connections.get(room)?.size || 0;
}