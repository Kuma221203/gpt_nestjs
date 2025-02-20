import { Transform } from "class-transformer";
import { IsBoolean, IsString } from "class-validator";

export class CreateChatDto {
  @IsString()
  model: string;
  
  @IsString()
  question: string;

  @IsString()
  isInit: string;
}

export class _CreateChatDto extends CreateChatDto{
  @IsString()
  stateId: string;
}
