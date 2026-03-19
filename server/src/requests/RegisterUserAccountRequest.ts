import { IsDefined, IsEmail, MaxLength, MinLength, IsOptional, IsString } from "class-validator";

export class RegisterUserAccountRequest {
  @IsDefined({ message: "User account type is required" })
  @IsString()
  user_type_name!: string;

  @IsDefined({ message: "Email is required" })
  @IsEmail({}, { message: "Invalid email address" })
  email!: string;

  @IsDefined({ message: "Password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters" })
  @MaxLength(20, { message: "Password must be at most 20 characters" })
  password!: string;
}
