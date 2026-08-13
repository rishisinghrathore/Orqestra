import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node';
import express from 'express';
import { AuthModule } from './auth.module';
import { AUTH, type Auth } from './auth';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule, {
    bodyParser: false,
  });

  const config = app.get(ConfigService);
  const auth = app.get<Auth>(AUTH);
  const clientOrigin = config.get<string>(
    'CLIENT_ORIGIN',
    'http://localhost:5173',
  );

  app.enableCors({
    origin: clientOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const expressApp = app.getHttpAdapter().getInstance() as express.Express;

  // Express v5 catch-all syntax — Better Auth handler must run before json parsing
  expressApp.all('/api/auth/{*any}', toNodeHandler(auth));
  expressApp.use(express.json());

  // setPassword is server-only in Better Auth; expose a thin cookie-authenticated wrapper.
  expressApp.post('/api/account/set-password', async (req, res) => {
    const newPassword =
      typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (!newPassword) {
      res.status(400).json({ message: 'newPassword is required' });
      return;
    }

    try {
      const data = await auth.api.setPassword({
        body: { newPassword },
        headers: fromNodeHeaders(req.headers),
      });
      res.json(data);
    } catch (error) {
      const err = error as {
        statusCode?: number;
        status?: number;
        body?: { message?: string };
        message?: string;
      };
      const status = err.statusCode ?? err.status ?? 400;
      res.status(status).json({
        message:
          err.body?.message ?? err.message ?? 'Failed to set password',
      });
    }
  });

  const port = Number(config.get<string | number>('AUTH_PORT', 3001));
  await app.listen(port);
  console.log(`Auth server listening on http://localhost:${port}`);
}

bootstrap();
