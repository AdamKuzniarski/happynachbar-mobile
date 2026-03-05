import { Controller, Body, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { PresignUploadResponseDto } from './dto/presign-upload-response.dto';
import { UploadsService } from './uploads.service';

@UseGuards(JwtAuthGuard)
@ApiTags('uploads')
@ApiBearerAuth('bearer')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @Post('presign')
  @ApiOkResponse({ type: PresignUploadResponseDto })
  presign(@Req() req: any, @Body() dto: PresignUploadDto) {
    return this.uploads.createPresignedImageUpload(req.user.userId, dto);
  }
}
