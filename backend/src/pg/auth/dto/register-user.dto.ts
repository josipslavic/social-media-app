import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  name: string;

  @IsEmail()
  @Transform(({ value }) => value.toLowerCase().trim())
  email: string;

  @IsString()
  @Transform(({ value }) => value.toLowerCase().trim())
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

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
