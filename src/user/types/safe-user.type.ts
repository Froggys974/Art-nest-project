import { User } from '../user.entity';

/**
 * User type without sensitive fields (password and refresh token hash).
 * Used for returning user data in API responses and passing user info in the application.
 */
export type SafeUser = Omit<User, 'password' | 'refreshTokenHash'>;
