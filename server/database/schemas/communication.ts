import { z } from 'zod'
import { baseSchema, validationPatterns } from './base'

export const messageSchema = z.object({
  ...baseSchema,
  senderId: validationPatterns.uuid,
  receiverId: validationPatterns.uuid,
  projectId: validationPatterns.uuid.optional(),
  content: validationPatterns.nonEmptyString,
})

export const messageCreateSchema = messageSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const messageUpdateSchema = messageSchema.partial().omit({
  id: true,
  createdAt: true,
  senderId: true,
})

export const messageThreadSchema = z.object({
  id: validationPatterns.uuid,
  project_id: validationPatterns.uuid.optional(),
  participants: z.array(validationPatterns.uuid).min(2),
  last_message_at: z.date(),
  is_archived: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
})

export const messageSearchSchema = z.object({
  sender_id: validationPatterns.uuid.optional(),
  receiver_id: validationPatterns.uuid.optional(),
  project_id: validationPatterns.uuid.optional(),
  content_search: validationPatterns.optionalString,
  date_from: validationPatterns.optionalDate,
  date_to: validationPatterns.optionalDate,
  is_archived: z.boolean().optional(),
})



export const notificationSchema = z.object({
  id: validationPatterns.uuid,
  user_id: validationPatterns.uuid,
  title: validationPatterns.nonEmptyString,
  message: validationPatterns.nonEmptyString,
  type: z.enum(['info', 'success', 'warning', 'error', 'project', 'proposal', 'message']),
  is_read: z.boolean().default(false),
  related_id: validationPatterns.uuid.optional(),
  related_type: z.enum(['project', 'proposal', 'message']).optional(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const notificationCreateSchema = notificationSchema.omit({
  id: true,
  is_read: true,
  created_at: true,
  updated_at: true,
})

export const notificationUpdateSchema = notificationSchema.partial().omit({
  id: true,
  created_at: true,
})

export const chatRoomSchema = z.object({
  id: validationPatterns.uuid,
  name: validationPatterns.optionalString,
  project_id: validationPatterns.uuid.optional(),
  participants: z.array(validationPatterns.uuid).min(2),
  is_group_chat: z.boolean().default(false),
  last_activity: z.date(),
  created_at: z.date(),
  updated_at: z.date(),
})

export type Message = z.infer<typeof messageSchema>
export type MessageCreate = z.infer<typeof messageCreateSchema>
export type MessageUpdate = z.infer<typeof messageUpdateSchema>
export type MessageThread = z.infer<typeof messageThreadSchema>
export type MessageSearch = z.infer<typeof messageSearchSchema>
export type Notification = z.infer<typeof notificationSchema>
export type NotificationCreate = z.infer<typeof notificationCreateSchema>
export type NotificationUpdate = z.infer<typeof notificationUpdateSchema>
export type ChatRoom = z.infer<typeof chatRoomSchema>

export const validateMessage = (data: unknown): Message => messageSchema.parse(data)
export const validateMessageCreate = (data: unknown): MessageCreate => messageCreateSchema.parse(data)
export const validateMessageUpdate = (data: unknown): MessageUpdate => messageUpdateSchema.parse(data)
export const validateMessageSearch = (data: unknown): MessageSearch => messageSearchSchema.parse(data)
export const validateNotification = (data: unknown): Notification => notificationSchema.parse(data)
export const validateNotificationCreate = (data: unknown): NotificationCreate => notificationCreateSchema.parse(data)
export const validateNotificationUpdate = (data: unknown): NotificationUpdate => notificationUpdateSchema.parse(data)
