import { Controller, Get, Post, Body, Patch, Param, Delete, Sse, MessageEvent, UseGuards, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';
import { Observable, map } from 'rxjs';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import { TokenPayload } from 'src/auth/interface/token-payload.interface';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) { }

  @Get('/stream/:id')
  @Sse()
  // @UseGuards(JwtAuthGuard)
  generate(
    @Param('id') id: string,
    @Query('model') model: string,
    @Query('question') question: string,
    @Query('isInit') isInit: string,
  ): Observable<MessageEvent> {
    const createChatDto: CreateChatDto = { model, question, isInit };
    return this.chatsService
      .generateStreaming({ ...createChatDto, stateId: id })
      .pipe(
        map((chunk) => ({
          data: chunk,
        })),
      );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createNewState(
    @CurrentUser() user: TokenPayload,
    @Body() createChatDto: CreateChatDto,
  ) {
    const stateId = await this.chatsService.newState({ userId: user.userId, ...createChatDto });
    return {stateId};
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getChats(@Param('id') id: string) {
    const response = await this.chatsService.getChats(id);
    return response;
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getStates(
    @CurrentUser() user: TokenPayload,
  ) {
    const response = await this.chatsService.getStates(user.userId)
    return response;
  }
}
