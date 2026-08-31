import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { map, Observable } from 'rxjs';

/**
 * Standard response envelope wrapping all successful API responses with metadata.
 */
export interface ResponseEnvelope<T> {
  data: T;
  meta: {
    path: string;
    method: string;
  };
  timestamp: string;
}

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<
  T,
  ResponseEnvelope<T>
> {
  /**
   * Wraps all successful responses in a standardized envelope with metadata.
   * @param context - The execution context
   * @param next - The call handler for the next interceptor or route handler
   * @returns Observable of the wrapped response
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          path: request.url,
          method: request.method,
        },
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
