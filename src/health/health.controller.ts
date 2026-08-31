import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/auth/public.decorator';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check — verifies API and database connectivity',
  })
  @ApiResponse({ status: 200, description: 'API and database are up' })
  @ApiResponse({ status: 503, description: 'Database unreachable' })
  check() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
