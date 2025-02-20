import { Injectable } from '@nestjs/common';
import { _CreateChatDto, CreateChatDto } from './dto/create-chat.dto';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateStateDto } from './dto/create-state.dto';
import { Observable } from 'rxjs';

@Injectable()
export class ChatsService {
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY')
    });
  }

  generateStreaming(createChatDto: _CreateChatDto): Observable<string> {
    return new Observable((subscriber) => {
      this.openai.chat.completions.create({
        model: createChatDto.model,
        messages: [{ role: 'user', content: createChatDto.question }],
        stream: true,
      })
        .then(async (stream) => {
          let fullResponse = '';
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            subscriber.next(content);
            fullResponse += content;
          }
          // --------------------------
          let exchangeId: string;

          if (createChatDto.isInit === "true") {
            exchangeId = (await this.prismaService.singleExchanges.findMany({
              select: { id: true },
              where: { stateId: createChatDto.stateId },
              orderBy: { createdAt: "desc" },
              take: 1,
            }))[0].id
          } else {
            const model = await this.prismaService.models.findUniqueOrThrow({
              where: { name: createChatDto.model },
              select: { id: true },
            });
            exchangeId = (await this.newMessages(model.id, createChatDto.stateId, createChatDto.question)).id
          }
          // --------------------------
          await this.prismaService.messages.create({
            data: {
              chatRole: 'MODEL',
              content: fullResponse || "Can't get response",
              exchangeId: exchangeId,
            },
          });
          subscriber.complete();
          console.log("Complete streaming");
        })
        .catch((error) => {
          subscriber.error(error);
        });
    });
  }


  async newState(createStateDto: CreateStateDto) {
    const systemMessage = `User sẽ gửi cho bạn một yêu cầu, bạn cần trả về một title miêu tả được yêu cầu đó với độ dài không vượt quá 30 chữ cái:
Ví dụ:
User Input : Common prompt engineering tools
Output: Common prompt enginnering
User Input: Giới thiệu một số mô hình ASR tiếng anh có thể chạy với tốc độ cao trên CPU
Output: ASR Models for CPU`
    const chatCompletion: OpenAI.Chat.ChatCompletion = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemMessage }, { role: 'user', content: createStateDto.question }],
      stream: false,
    })
    const title = chatCompletion.choices[0].message.content as string 
    const [newState, model] = await Promise.all([
      this.prismaService.states.create({
        data: {
          titile: title,
          userId: createStateDto.userId,
        },
        select: { id: true },
      }),
      this.prismaService.models.findUniqueOrThrow({
        where: { name: createStateDto.model },
        select: { id: true },
      }),
    ]);
    console.log(newState);

    await this.newMessages(model.id, newState.id, createStateDto.question);
    return newState.id;
  }

  async newMessages(modelId: string, stateId: string, content: string) {
    const newSingleExchange = await this.prismaService.singleExchanges.create({
      data: {
        modelId: modelId,
        stateId: stateId,
      },
      select: { id: true },
    });

    await this.prismaService.messages.create({
      data: {
        content: content,
        exchangeId: newSingleExchange.id,
      },
    });
    return newSingleExchange;
  }

  async getChats(stateId: string) {
    const result = await this.prismaService.singleExchanges.findMany({
      where: {
        stateId: stateId,
      },
      select: {
        model: {
          select: {
            name: true,
          }
        },
        messages: {
          select: {
            chatRole: true,
            content: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      }
    })
    return result;
  }

  async getStates(userId: string) {
    const result = await this.prismaService.states.findMany({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        titile: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })
    return result;
  }

}
