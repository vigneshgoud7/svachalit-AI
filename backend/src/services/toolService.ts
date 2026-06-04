import { prisma } from '../db/client';
import { EventEmitter } from 'events';
<<<<<<< HEAD
import { env } from '../config/env';
import crypto from 'crypto';
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

// Global Event Emitter for SSE real-time broadcasts to the dashboard
export const liveChatEmitter = new EventEmitter();

export interface BookAppointmentArgs {
  dateTime: string;
  customerName: string;
  conversationId: string;
}

export interface ExportToSheetArgs {
  leadData: {
    name?: string;
    email?: string;
    phone?: string;
    company?: string;
    budget?: string;
    notes?: string;
  };
  conversationId: string;
}

export interface TransferToHumanArgs {
  conversationId: string;
}

export class ToolService {

  // FIX: expose emitter through ToolService
  static liveChatEmitter = liveChatEmitter;

<<<<<<< HEAD
  private static async recordToolEvent(args: {
    conversationId: string;
    toolName: string;
    status: string;
    input?: unknown;
    output?: unknown;
  }) {
    try {
      await prisma.$executeRaw`
        INSERT INTO "ToolEvent" ("id", "conversationId", "toolName", "status", "input", "output")
        VALUES (
          ${crypto.randomUUID()},
          ${args.conversationId},
          ${args.toolName},
          ${args.status},
          ${args.input ? JSON.stringify(args.input) : null}::jsonb,
          ${args.output ? JSON.stringify(args.output) : null}::jsonb
        )
      `;
    } catch (error) {
      console.warn('[ToolEvent] Failed to persist tool event:', error);
    }
  }

  private static async postJsonWebhook(url: string, payload: unknown) {
    if (!url) {
      return null;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook failed with HTTP ${response.status}`);
    }

    return response.json().catch(() => ({ ok: true }));
  }

=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
  /**
   * Mock implementation of scheduling a calendar appointment.
   * Updates customer profile metadata in the DB.
   */
  static async bookAppointment(args: BookAppointmentArgs) {
    console.log(`[Tool: bookAppointment] Scheduling for ${args.customerName} at ${args.dateTime}`);
<<<<<<< HEAD
    await ToolService.recordToolEvent({
      conversationId: args.conversationId,
      toolName: 'bookAppointment',
      status: 'started',
      input: args
    });
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
    
    const conversation = await prisma.conversation.findUnique({
      where: { id: args.conversationId },
      include: { customer: true }
    });

    if (!conversation) {
      throw new Error(`Conversation not found: ${args.conversationId}`);
    }

    const existingMetadata = (conversation.customer.metadata as Record<string, any>) || {};

    const updatedMetadata = {
      ...existingMetadata,
      appointmentDate: args.dateTime,
      appointmentName: args.customerName,
      lastInteractionTool: 'bookAppointment'
    };

    const updatedCustomer = await prisma.customer.update({
      where: { id: conversation.customerId },
      data: {
        name: args.customerName || conversation.customer.name,
        metadata: updatedMetadata
      }
    });

    ToolService.liveChatEmitter.emit('crm-update', {
      conversationId: args.conversationId,
      customerId: conversation.customerId,
      customer: updatedCustomer
    });

<<<<<<< HEAD
    let providerResult: unknown = { provider: 'mock-calendar' };

    try {
      providerResult = await ToolService.postJsonWebhook(env.CALENDAR_WEBHOOK_URL, {
        conversationId: args.conversationId,
        customerId: conversation.customerId,
        customerName: args.customerName,
        dateTime: args.dateTime
      }) || providerResult;
    } catch (error) {
      providerResult = {
        provider: 'mock-calendar',
        warning: String(error)
      };
    }

    const result = {
      success: true,
      message: `Appointment scheduled successfully for ${args.customerName} on ${args.dateTime}.`,
      data: {
        appointmentDate: args.dateTime,
        providerResult
      }
    };

    await ToolService.recordToolEvent({
      conversationId: args.conversationId,
      toolName: 'bookAppointment',
      status: 'completed',
      input: args,
      output: result
    });

    return result;
=======
    return {
      success: true,
      message: `Appointment scheduled successfully for ${args.customerName} on ${args.dateTime}.`,
      data: { appointmentDate: args.dateTime }
    };
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
  }

  /**
   * Mock implementation of exporting lead details to CRM/Google Sheet.
   */
  static async exportToSheet(args: ExportToSheetArgs) {
    console.log(`[Tool: exportToSheet] Exporting lead data:`, args.leadData);
<<<<<<< HEAD
    await ToolService.recordToolEvent({
      conversationId: args.conversationId,
      toolName: 'exportToSheet',
      status: 'started',
      input: args.leadData
    });
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

    const conversation = await prisma.conversation.findUnique({
      where: { id: args.conversationId },
      include: { customer: true }
    });

    if (!conversation) {
      throw new Error(`Conversation not found: ${args.conversationId}`);
    }

    const existingMetadata = (conversation.customer.metadata as Record<string, any>) || {};

    const updatedMetadata = {
      ...existingMetadata,
      exportedToSheet: true,
      exportedAt: new Date().toISOString(),
      leadDetails: {
        ...((existingMetadata.leadDetails as object) || {}),
        ...args.leadData
      }
    };

    const updatedCustomer = await prisma.customer.update({
      where: { id: conversation.customerId },
      data: {
        email: args.leadData.email || conversation.customer.email,
        name: args.leadData.name || conversation.customer.name,
        metadata: updatedMetadata
      }
    });

    ToolService.liveChatEmitter.emit('crm-update', {
      conversationId: args.conversationId,
      customerId: conversation.customerId,
      customer: updatedCustomer
    });

<<<<<<< HEAD
    let sinkResult: unknown = { provider: 'local-metadata' };

    try {
      sinkResult = await ToolService.postJsonWebhook(env.GOOGLE_SHEETS_WEBHOOK_URL, {
        conversationId: args.conversationId,
        customerId: conversation.customerId,
        leadData: args.leadData
      }) || sinkResult;
    } catch (error) {
      sinkResult = {
        provider: 'local-metadata',
        warning: String(error)
      };
    }

    const result = {
      success: true,
      message: 'Lead details saved successfully.',
      exportedData: args.leadData,
      sinkResult
    };

    await ToolService.recordToolEvent({
      conversationId: args.conversationId,
      toolName: 'exportToSheet',
      status: 'completed',
      input: args.leadData,
      output: result
    });

    return result;
=======
    return {
      success: true,
      message: `Lead metrics successfully exported to sheet storage.`,
      exportedData: args.leadData
    };
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
  }

  /**
   * Transfer conversation to human support.
   */
  static async transferToHuman(args: TransferToHumanArgs) {
    console.log(`[Tool: transferToHuman] Handoff requested for conversation: ${args.conversationId}`);
<<<<<<< HEAD
    await ToolService.recordToolEvent({
      conversationId: args.conversationId,
      toolName: 'transferToHuman',
      status: 'started',
      input: args
    });
=======
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c

    const updatedConversation = await prisma.conversation.update({
      where: { id: args.conversationId },
      data: {
        status: 'HUMAN_PENDING'
      },
      include: {
        customer: true
      }
    });

    ToolService.liveChatEmitter.emit('transfer-to-human', {
      conversationId: args.conversationId,
      status: 'HUMAN_PENDING',
      conversation: updatedConversation
    });

<<<<<<< HEAD
    const result = {
=======
    return {
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
      success: true,
      message: `Conversation transferred to human queue. The AI responder has paused.`,
      conversationStatus: 'HUMAN_PENDING'
    };
<<<<<<< HEAD

    await ToolService.recordToolEvent({
      conversationId: args.conversationId,
      toolName: 'transferToHuman',
      status: 'completed',
      input: args,
      output: result
    });

    return result;
  }
}
=======
  }
}
>>>>>>> 765969bd30239688115f15de9bc845dfa0e7665c
