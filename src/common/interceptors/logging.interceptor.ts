import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = http.getResponse<Response>();
          this.logger.log(
            `${request.method} ${request.url} ${response.statusCode} +${Date.now() - startedAt}ms`,
          );
        },
        error: (error: Error) => {
          this.logger.warn(
            `${request.method} ${request.url} failed (${error.name}) +${Date.now() - startedAt}ms`,
          );
        },
      }),
    );
  }
}
