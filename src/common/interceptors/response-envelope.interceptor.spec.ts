import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ResponseEnvelopeInterceptor } from './response-envelope.interceptor';

describe('ResponseEnvelopeInterceptor', () => {
  const interceptor = new ResponseEnvelopeInterceptor();

  const context = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/api/v1/artworks', method: 'GET' }),
    }),
  } as unknown as ExecutionContext;

  const handlerReturning = (value: unknown): CallHandler => ({
    handle: () => of(value),
  });

  it('wraps the payload in { data, meta, timestamp }', async () => {
    const payload = [{ id: 1 }];

    const result = await firstValueFrom(
      interceptor.intercept(context, handlerReturning(payload)),
    );

    expect(result.data).toBe(payload);
    expect(result.meta).toEqual({ path: '/api/v1/artworks', method: 'GET' });
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  });

  it('keeps null payloads as data: null', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(context, handlerReturning(null)),
    );

    expect(result.data).toBeNull();
  });
});
