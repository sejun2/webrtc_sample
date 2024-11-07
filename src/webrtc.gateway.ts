// webrtc.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WebRtcGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private connectedUsers: Map<string, Socket> = new Map();
  private waitingUsers: Set<string> = new Set();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedUsers.set(client.id, client);
    this.findPeer(client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
    this.waitingUsers.delete(client.id);
  }

  @SubscribeMessage('find-peer')
  private findPeer(client: Socket) {
    if (this.waitingUsers.size > 0) {
      const [peerId] = this.waitingUsers;
      const peerSocket = this.connectedUsers.get(peerId);

      if (peerSocket) {
        this.waitingUsers.delete(peerId);
        // Notify both users about the match
        client.emit('peer-found', { peerId });
        console.log(`peer-found ${peerId}`);
        peerSocket.emit('peer-found', { peerId: client.id });
      }
    } else {
      this.waitingUsers.add(client.id);
    }
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, payload: { target: string; offer: any }) {
    const targetSocket = this.connectedUsers.get(payload.target);
    if (targetSocket) {
      targetSocket.emit('offer', {
        offer: payload.offer,
        from: client.id,
      });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, payload: { target: string; answer: any }) {
    const targetSocket = this.connectedUsers.get(payload.target);
    if (targetSocket) {
      targetSocket.emit('answer', {
        answer: payload.answer,
        from: client.id,
      });
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    client: Socket,
    payload: { target: string; candidate: any },
  ) {
    const targetSocket = this.connectedUsers.get(payload.target);
    if (targetSocket) {
      targetSocket.emit('ice-candidate', {
        candidate: payload.candidate,
        from: client.id,
      });
    }
  }
}
