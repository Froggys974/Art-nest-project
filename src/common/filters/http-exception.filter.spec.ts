import { ArgumentsHost, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let json: jest.Mock;
  let status: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    json = jest.fn();
    status = jest.fn().mockReturnValue({ json });
    host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url: '/api/v1/missing', method: 'GET' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('renders an HttpException with its own status and message', () => {
    filter.catch(new NotFoundException('Artwork not found'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Artwork not found',
        path: '/api/v1/missing',
      }),
    );
  });

  it('masks unexpected errors behind a generic 500', () => {
    filter.catch(new Error('secret db failure'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const body = (json.mock.calls as unknown[][])[0][0] as {
      message: string;
    };
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('secret db failure');
  });
});
