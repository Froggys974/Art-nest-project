import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessRuleViolationException } from '../exceptions/business-rule-violation.exception';

@Catch(BusinessRuleViolationException)
export class BusinessRuleViolationFilter implements ExceptionFilter {
  /**
   * Catches business rule violations and formats them as HTTP 422 responses.
   * @param exception - The business rule violation exception
   * @param host - The arguments host for accessing request/response
   */
  catch(exception: BusinessRuleViolationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      error: 'Business Rule Violation',
      rule: exception.rule,
      message: exception.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
