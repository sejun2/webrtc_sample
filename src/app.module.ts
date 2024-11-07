import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebRtcGateway } from './webrtc.gateway';

@Module({
  imports: [],
})
@Module({
  imports: [],
  providers: [WebRtcGateway, AppService],
  controllers: [AppController],
})
export class AppModule {}
