import { Injectable } from '@nestjs/common';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ModelsService {
  constructor(private readonly prismaService: PrismaService) { }

  async create(createModelDto: CreateModelDto) {
    try {
      const newModel = await this.prismaService.models.create({
        data: {...createModelDto},
        select: {
          name: true,
          description: true
        }
      })
      return newModel;
    }
    catch (error) {
      throw error;
    }
  }

  async findAll() {
    try {
      const models = await this.prismaService.models.findMany({
        select: {
          name: true,
          description: true
        }
      })
      return models;
    }
    catch (error) {
      throw error;
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} model`;
  }

  update(id: number, updateModelDto: UpdateModelDto) {
    return `This action updates a #${id} model`;
  }

  remove(id: number) {
    return `This action removes a #${id} model`;
  }
}
