import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ChatService } from './chat.service';
import { ConversationDto } from './dto/conversation.dto';
import {
  ChatMessagesQueryDto,
  EditMessageDto,
  ListMessagesResponseDto,
} from './dto/chat-messages.dto';
import {
  ConversationListItemDto,
  ListConversationsResponseDto,
} from './dto/chat-conversations.dto';
import { UnreadCountDto } from './dto/chat-unread.dto';

@ApiTags('chat')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Post('conversations/by-activity/:id')
  @ApiOkResponse({ type: ConversationDto })
  createOrGetByActivity(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chat.createOrGetByActivity(req.user.userId, id);
  }

  @Post('conversations/by-user/:id')
  @ApiOkResponse({ type: ConversationDto })
  createOrGetByUser(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chat.createOrGetByUser(req.user.userId, id);
  }

  @Post('conversations/group/:id')
  @ApiOkResponse({ type: ConversationDto })
  createOrGetGroupByActivity(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.chat.createOrGetGroupByActivity(req.user.userId, id);
  }

  @Get('conversations')
  @ApiOkResponse({ type: ListConversationsResponseDto })
  listConversations(@Req() req: any) {
    return this.chat.listConversations(req.user.userId);
  }

  @Get('conversations/:id')
  @ApiOkResponse({ type: ConversationListItemDto })
  getConversation(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.chat.getConversation(req.user.userId, id);
  }

  @Post('conversations/:id/read')
  markRead(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.chat.markRead(req.user.userId, id);
  }

  @Get('unread-count')
  @ApiOkResponse({ type: UnreadCountDto })
  getUnreadCount(@Req() req: any) {
    return this.chat.getUnreadCount(req.user.userId);
  }

  @Get('conversations/:id/messages')
  @ApiOkResponse({ type: ListMessagesResponseDto })
  listMessages(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query() q: ChatMessagesQueryDto,
  ) {
    return this.chat.listMessages(req.user.userId, id, q);
  }

  @Patch('messages/:id')
  editMessage(
    @Req() req: any,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: EditMessageDto,
  ) {
    return this.chat.editMessage(req.user.userId, id, body.body);
  }

  @Delete('messages/:id')
  deleteMessage(@Req() req: any, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.chat.deleteMessage(req.user.userId, id);
  }
}
