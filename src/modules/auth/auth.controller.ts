import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authSvc: AuthService) {}

  @Post('/login')
  login(@Body() dto: LoginDto) {
    return this.authSvc.login(dto);
  }

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req) {
    const user = req.user;
    return this.authSvc.getMe(user);
  }

  @Post('refresh-token')
  async refreshToken(@Body() body: { refreshToken: string }) {
    return this.authSvc.refreshTokens(body.refreshToken);
  }
}
