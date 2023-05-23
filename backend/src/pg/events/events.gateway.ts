import {
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
@Injectable()
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor() {}
  @WebSocketServer() public server: Server;
  private logger: Logger = new Logger('EventsGateway');
  private users: { socketId: string; userId: number }[] = [];

  findConnectedUserSocket(userId: number) {
    console.log(this.users);
    return this.users.find((user) => user.userId === userId);
  }

  afterInit(server: Server) {
    this.server = server;
    this.logger.log('running server');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  handleConnection(client: Socket, ..._args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  @SubscribeMessage('join')
  async handleJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { userId }: { userId: number },
  ) {
    const user = this.users.find((user) => user.userId === userId);

    if (user && user.socketId === socket.id) return;

    if (user) {
      const indexOf = this.users
        .map((user) => user.socketId)
        .indexOf(socket.id);

      this.users.splice(indexOf, 1);
    }

    const newUser = { userId, socketId: socket.id };

    this.users.push(newUser);

    setInterval(() => {
      this.server.emit('connectedUsers', {
        users: this.users.filter((user) => user.userId !== userId),
      });
    }, 10000);
  }

  @SubscribeMessage('disconnect')
  async handleLeave(@ConnectedSocket() socket: Socket) {
    const indexOf = this.users.map((user) => user.socketId).indexOf(socket.id);
    this.users.splice(indexOf, 1);
  }
}
