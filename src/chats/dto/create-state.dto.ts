import { IsString } from "class-validator";

export class CreateStateDto {
  @IsString()
  model: string;

  @IsString()
  question: string;

  @IsString()
  userId:string
}
