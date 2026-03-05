import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { randomUUID } from 'crypto';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { PresignUploadResponseDto } from './dto/presign-upload-response.dto';

const EXT_BY_CONTENT_TYPE: Record<PresignUploadDto['contentType'], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnBaseUrl: string;
  private readonly maxBytes: number;
  private readonly presignExpitesSeconds: number;

  constructor(private readonly config: ConfigService) {
    const region = this.config.getOrThrow<string>('AWS_REGION');
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');

    this.cdnBaseUrl = this.config
      .getOrThrow<string>('CLOUDFRONT_BASE_URL')
      .replace(/\/+$/, '');

    this.maxBytes = Number(this.config.get('UPLOAD_MAX_BYTES') ?? 10_000_000);
    this.presignExpitesSeconds = Number(
      this.config.get('UPLOAD_PRESIGN_EXPIRES_SECONDS') ?? 60,
    );

    this.s3 = new S3Client({ region });
  }

  async createPresignedImageUpload(
    userId: string,
    dto: PresignUploadDto,
  ): Promise<PresignUploadResponseDto> {
    const ext = EXT_BY_CONTENT_TYPE[dto.contentType];
    if (!ext) throw new BadRequestException('Unsuported contentType');

    const safeUser = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `uploads/${dto.kind}/${safeUser}/${randomUUID()}.${ext}`;

    const { url, fields } = await createPresignedPost(this.s3, {
      Bucket: this.bucket,
      Key: key,
      Expires: this.presignExpitesSeconds,
      Fields: { 'Content-Type': dto.contentType },
      Conditions: [
        ['content-length-range', 1, this.maxBytes],
        ['eq', '$Content-Type', dto.contentType],
      ],
    });

    return {
      assetUrl: `${this.cdnBaseUrl}/${key}`,
      key,
      uploadUrl: url,
      uploadFiles: fields,
      expiresIn: this.presignExpitesSeconds,
    };
  }
}
