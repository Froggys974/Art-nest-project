import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/user/user-role.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to restrict route access to specific user roles.
 * @param roles - The roles allowed to access the route
 * @example @Roles(UserRole.ADMIN, UserRole.GALLERY)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
