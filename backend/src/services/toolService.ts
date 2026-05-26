import { prisma } from '../db/client';
import { EventEmitter } from 'events';

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
  /**
   * Mock implementation of scheduling a calendar appointment.
   * Updates customer profile metadata in the DB.
   */
  static async bookAppointment(args: BookAppointmentArgs) {
    console.log(`[Tool: bookAppointment] Scheduling for ${args.customerName} at ${args.dateTime}`);
    
    // Find conversation to get customer ID
    const conversation = await prisma.conversation.findUnique({
      where: { id: args.conversationId },
      include: { customer: true }
    });

    if (!conversation) {
      throw new Error(`Conversation not found: ${args.conversationId}`);
    }

    // Merge metadata
    const existingMetadata = (conversation.customer.metadata as Record<string, any>) || {};
    const updatedMetadata = {
      ...existingMetadata,
      appointmentDate: args.dateTime,
      appointmentName: args.customerName,
      lastInteractionTool: 'bookAppointment'
    };

    // Update customer name and metadata
    const updatedCustomer = await prisma.customer.update({
      where: { id: conversation.customerId },
      data: {
        name: args.customerName || conversation.customer.name,
        metadata: updatedMetadata
      }
    });

    // Notify agent dashboard of CRM update
    liveChatEmitter.emit('crm-update', {
      conversationId: args.conversationId,
      customerId: conversation.customerId,
      customer: updatedCustomer
    });

    return {
      success: true,
      message: `Appointment scheduled successfully for ${args.customerName} on ${args.dateTime}.`,
      data: { appointmentDate: args.dateTime }
    };
  }

  /**
   * Mock implementation of exporting lead details to a CRM / Google Sheet.
   * Logs details to a storage sink and tags the Customer.
   */
  static async exportToSheet(args: ExportToSheetArgs) {
    console.log(`[Tool: exportToSheet] Exporting lead data:`, args.leadData);

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

    // Update customer details (populate emails/phones if captured)
    const updatedCustomer = await prisma.customer.update({
      where: { id: conversation.customerId },
      data: {
        email: args.leadData.email || conversation.customer.email,
        name: args.leadData.name || conversation.customer.name,
        metadata: updatedMetadata
      }
    });

    liveChatEmitter.emit('crm-update', {
      conversationId: args.conversationId,
      customerId: conversation.customerId,
      customer: updatedCustomer
    });

    return {
      success: true,
      message: `Lead metrics successfully exported to sheet storage.`,
      exportedData: args.leadData
    };
  }

  /**
   * Transition conversation status from AI_MANAGED to HUMAN_PENDING.
   * Stop automated AI agent replies, trigger real-time dashboard notify.
   */
  static async transferToHuman(args: TransferToHumanArgs) {
    console.log(`[Tool: transferToHuman] Handoff requested for conversation: ${args.conversationId}`);

    const updatedConversation = await prisma.conversation.update({
      where: { id: args.conversationId },
      data: {
        status: 'HUMAN_PENDING'
      },
      include: {
        customer: true
      }
    });

    // Broadcast transfer event to all connected dashboard agents
    liveChatEmitter.emit('transfer-to-human', {
      conversationId: args.conversationId,
      status: 'HUMAN_PENDING',
      conversation: updatedConversation
    });

    return {
      success: true,
      message: `Conversation transferred to human queue. The AI responder has paused.`,
      conversationStatus: 'HUMAN_PENDING'
    };
  }
}
