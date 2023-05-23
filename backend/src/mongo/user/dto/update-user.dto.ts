import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  bio: string;

  @IsString()
  facebook: string;

  @IsString()
  youtube: string;

  @IsString()
  twitter: string;

  @IsString()
  instagram: string;
}
