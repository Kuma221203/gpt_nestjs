import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ChatsModule } from './chats/chats.module';
import { ModelsModule } from './models/models.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsersModule, 
    AuthModule, 
    ChatsModule, 
    ModelsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
