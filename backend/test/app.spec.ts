import { Test } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('🛠️ Testing env set up correctly', () => {
  let configService: ConfigService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.test.env',
        }),
      ],
      providers: [ConfigService],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should have a POSTGRES_HOST', () => {
    expect(configService.get('POSTGRES_HOST')).toBeDefined();
  });

  it('should have a POSTGRES_PORT', () => {
    expect(configService.get('POSTGRES_PORT')).toBeDefined();
  });

  it('should have a POSTGRES_USER', () => {
    expect(configService.get('POSTGRES_USER')).toBeDefined();
  });

  it('should have a POSTGRES_PASSWORD', () => {
    expect(configService.get('POSTGRES_PASSWORD')).toBeDefined();
  });

  it('should have a POSTGRES_DB', () => {
    expect(configService.get('POSTGRES_DB')).toBeDefined();
  });
});
