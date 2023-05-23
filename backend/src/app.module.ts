import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from '@hapi/joi';
import { PgAppModule } from './pg/pg-app.module';
import { MongoAppModule } from './mongo/mongo-app.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      validationSchema: Joi.object({
        DATABASE: Joi.equal('pg', 'mongo'),
      }),
    }),
    process.env.DATABASE === 'pg' ? PgAppModule : MongoAppModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
