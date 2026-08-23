import { envValidationSchema } from './env.validation';

describe('envValidationSchema', () => {
  const validEnv = {
    DB_HOST: 'postgres',
    POSTGRES_USER: 'nest',
    POSTGRES_PASSWORD: 'secret',
    POSTGRES_DB: 'nest',
    JWT_SECRET: 'a-secret-of-at-least-16-chars',
  };

  it('accepts a complete environment and applies defaults', () => {
    const { error, value } = envValidationSchema.validate(validEnv) as {
      error?: Error;
      value: Record<string, unknown>;
    };

    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('development');
    expect(value.PORT).toBe(3000);
    expect(value.DB_PORT).toBe(5432);
    expect(value.JWT_EXPIRES_IN).toBe('15m');
  });

  it('rejects a missing JWT_SECRET', () => {
    const withoutSecret: Partial<typeof validEnv> = { ...validEnv };
    delete withoutSecret.JWT_SECRET;

    const { error } = envValidationSchema.validate(withoutSecret);

    expect(error?.message).toContain('JWT_SECRET');
  });

  it('rejects a non-numeric port', () => {
    const { error } = envValidationSchema.validate({
      ...validEnv,
      DB_PORT: 'not-a-port',
    });

    expect(error?.message).toContain('DB_PORT');
  });
});
