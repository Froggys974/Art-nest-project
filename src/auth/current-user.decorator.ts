import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SafeUser } from 'src/user/types/safe-user.type';

/**
 * Parameter decorator to extract the current authenticated user from the request.
 * Can optionally extract a specific property from the user object.
 * @example @CurrentUser() user: SafeUser
 * @example @CurrentUser('userId') userId: number
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: SafeUser }>();
    const user = request.user;

    return data ? user?.[data as keyof SafeUser] : user;
  },
);
