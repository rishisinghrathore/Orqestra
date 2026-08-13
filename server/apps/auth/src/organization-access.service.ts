import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';
import { AUTH, type Auth } from './auth';

@Injectable()
export class OrganizationAccessService {
  constructor(@Inject(AUTH) private readonly auth: Auth) {}

  async requireOrganization(
    headers: IncomingHttpHeaders,
    organizationId?: string,
  ): Promise<{ userId: string; organizationId: string }> {
    const nodeHeaders = fromNodeHeaders(headers);
    const session = await this.auth.api.getSession({
      headers: nodeHeaders,
    });

    if (!session?.user) {
      throw new UnauthorizedException('Not authenticated');
    }

    const activeId =
      organizationId ||
      (session.session as { activeOrganizationId?: string | null })
        .activeOrganizationId ||
      '';

    if (!activeId) {
      throw new BadRequestException('organizationId is required');
    }

    const org = await this.auth.api.getFullOrganization({
      query: { organizationId: activeId },
      headers: nodeHeaders,
    });

    if (!org) {
      throw new ForbiddenException('Organization not found or access denied');
    }

    return { userId: session.user.id, organizationId: activeId };
  }
}
