import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BusinessRuleViolationException } from '../exceptions/business-rule-violation.exception';
import { BusinessRuleViolationFilter } from './business-rule-violation.filter';

describe('BusinessRuleViolationFilter', () => {
  it('renders the violation as a 422 with the rule identifier', () => {
    const filter = new BusinessRuleViolationFilter();
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/api/v1/sales', method: 'POST' }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(
      new BusinessRuleViolationException(
        'Sale price is below the reserve price',
        'ARTWORK_BELOW_RESERVE_PRICE',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        error: 'Business Rule Violation',
        rule: 'ARTWORK_BELOW_RESERVE_PRICE',
        message: 'Sale price is below the reserve price',
        path: '/api/v1/sales',
      }),
    );
  });
});
