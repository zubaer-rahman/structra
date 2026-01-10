import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '~/server/trpc'
import { TRPCError } from '@trpc/server'

const messageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1, 'Message content is required'),
  message_type: z.enum(['text', 'image', 'file']).default('text'),
  file_url: z.string().url().optional(),
  file_name: z.string().optional(),
})

export const messagesRouter = router({
  // Send a message
  send: protectedProcedure
    .input(messageSchema)
    .mutation(async ({ input, ctx }) => {
      // Check if user is part of the conversation
      const { data: conversation, error: convError } = await ctx.supabase
        .from('conversations')
        .select('*')
        .eq('id', input.conversation_id)
        .single()

      if (convError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        })
      }

      if (conversation.homeowner_id !== ctx.user.id && conversation.contractor_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not part of this conversation',
        })
      }

      const { data, error } = await ctx.supabase
        .from('messages')
        .insert({
          ...input,
          sender_id: ctx.user.id,
        })
        .select(`
          *,
          profiles!messages_sender_id_fkey (
            id,
            full_name
          )
        `)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      // Update conversation's last_message_at
      await ctx.supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', input.conversation_id)

      return data
    }),

  // Get messages for a conversation
  getByConversation: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      // Check if user is part of the conversation
      const { data: conversation, error: convError } = await ctx.supabase
        .from('conversations')
        .select('homeowner_id, contractor_id')
        .eq('id', input.conversationId)
        .single()

      if (convError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        })
      }

      if (conversation.homeowner_id !== ctx.user.id && conversation.contractor_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not part of this conversation',
        })
      }

      const { data, error } = await ctx.supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey (
            id,
            full_name
          )
        `)
        .eq('conversation_id', input.conversationId)
        .range(input.offset, input.offset + input.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data.reverse() // Return in chronological order
    }),

  // Get user's conversations
  getConversations: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const { data, error } = await ctx.supabase
        .from('conversations')
        .select(`
          *,
          projects (
            id,
            title
          ),
          homeowner:profiles!conversations_homeowner_id_fkey (
            id,
            full_name
          ),
          contractor:profiles!conversations_contractor_id_fkey (
            id,
            full_name
          ),
          messages (
            id,
            content,
            created_at,
            sender_id,
            message_type
          )
        `)
        .or(`homeowner_id.eq.${ctx.user.id},contractor_id.eq.${ctx.user.id}`)
        .range(input.offset, input.offset + input.limit - 1)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      // Get the latest message for each conversation
      const conversationsWithLatestMessage = data.map(conversation => {
        const latestMessage = conversation.messages
          ?.sort((a: { created_at: string }, b: { created_at: string }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
        return {
          ...conversation,
          latest_message: latestMessage || null,
          messages: undefined, // Remove the messages array to avoid confusion
        }
      })

      return conversationsWithLatestMessage
    }),

  // Create or get conversation
  createOrGetConversation: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        otherUserId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Verify the project exists
      const { data: project, error: projectError } = await ctx.supabase
        .from('projects')
        .select('homeowner_id')
        .eq('id', input.projectId)
        .single()

      if (projectError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Project not found',
        })
      }

      // Determine homeowner and contractor
      let homeownerId: string
      let contractorId: string

      if (project.homeowner_id === ctx.user.id) {
        homeownerId = ctx.user.id
        contractorId = input.otherUserId
      } else if (input.otherUserId === project.homeowner_id) {
        homeownerId = input.otherUserId
        contractorId = ctx.user.id
      } else {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid conversation participants',
        })
      }

      // Check if conversation already exists
      const { data: existingConversation } = await ctx.supabase
        .from('conversations')
        .select('*')
        .eq('project_id', input.projectId)
        .eq('homeowner_id', homeownerId)
        .eq('contractor_id', contractorId)
        .single()

      if (existingConversation) {
        return existingConversation
      }

      // Create new conversation
      const { data: newConversation, error } = await ctx.supabase
        .from('conversations')
        .insert({
          project_id: input.projectId,
          homeowner_id: homeownerId,
          contractor_id: contractorId,
        })
        .select(`
          *,
          projects (
            id,
            title
          ),
          homeowner:profiles!conversations_homeowner_id_fkey (
            id,
            full_name
          ),
          contractor:profiles!conversations_contractor_id_fkey (
            id,
            full_name
          )
        `)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return newConversation
    }),

  // Mark messages as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check if user is part of the conversation
      const { data: conversation, error: convError } = await ctx.supabase
        .from('conversations')
        .select('homeowner_id, contractor_id')
        .eq('id', input.conversationId)
        .single()

      if (convError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        })
      }

      if (conversation.homeowner_id !== ctx.user.id && conversation.contractor_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not part of this conversation',
        })
      }

      // Mark all unread messages in this conversation as read
      const { error } = await ctx.supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', input.conversationId)
        .neq('sender_id', ctx.user.id)
        .is('read_at', null)

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return { success: true }
    }),

  // Get unread message count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    // First get the conversation IDs where the user is a participant
    const { data: conversations, error: conversationsError } = await ctx.supabase
      .from('conversations')
      .select('id')
      .or(`homeowner_id.eq.${ctx.user.id},contractor_id.eq.${ctx.user.id}`)

    if (conversationsError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: conversationsError.message,
      })
    }

    if (!conversations || conversations.length === 0) {
      return { count: 0 }
    }

    const conversationIds = conversations.map(conv => conv.id)

    const { data, error } = await ctx.supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .neq('sender_id', ctx.user.id)
      .is('read_at', null)
      .in('conversation_id', conversationIds)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return { count: data?.length || 0 }
  }),

  // Delete message (sender only)
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Check if user owns the message
      const { data: message, error: fetchError } = await ctx.supabase
        .from('messages')
        .select('sender_id')
        .eq('id', input.id)
        .single()

      if (fetchError) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        })
      }

      if (message.sender_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own messages',
        })
      }

      const { error } = await ctx.supabase
        .from('messages')
        .delete()
        .eq('id', input.id)

      if (error) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: error.message,
        })
      }

      return { success: true }
    }),
})