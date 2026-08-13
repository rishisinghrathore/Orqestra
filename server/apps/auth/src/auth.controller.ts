import { Controller, Get } from '@nestjs/common';

@Controller()
export class AuthController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
