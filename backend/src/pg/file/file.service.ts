import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';
import * as sharp from 'sharp';

@Injectable()
export class FileService {
  private readonly s3: S3;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3({
      region: configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: configService.get('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY') as string,
      },
    });
  }

  async uploadPublicFile(dataBuffer: Buffer, filename: string) {
    const compressedBuffer = await sharp(dataBuffer)
      .webp({ quality: 75 })
      .resize(300, 300, { fit: 'cover' })
      .toBuffer();

    const uploadResult = await this.s3
      .upload({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME') as string,
        Body: compressedBuffer,
        ACL: 'public-read',
        Key: `${uuid()}-${filename}`.replace(/\//g, ''),
      })
      .promise();

    return uploadResult.Location;
  }

  async deletePublicFile(imageUrl: string) {
    const filename = imageUrl.split('/').pop();
    const deleteResult = await this.s3
      .deleteObject({
        Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME') as string,
        Key: filename as string,
      })
      .promise();

    return deleteResult.$response;
  }
}
