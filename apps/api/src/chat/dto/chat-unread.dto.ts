import { ApiProperty } from '@nestjs/swagger';

export class UnreadCountDto {
  @ApiProperty({ example: 2 })
  count!: number;
}
