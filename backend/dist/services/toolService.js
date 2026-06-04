"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolService = exports.liveChatEmitter = void 0;
const client_1 = require("../db/client");
const events_1 = require("events");
// Global Event Emitter for SSE real-time broadcasts to the dashboard
exports.liveChatEmitter = new events_1.EventEmitter();
class ToolService {
    // FIX: expose emitter through ToolService
    static liveChatEmitter = exports.liveChatEmitter;
    /**
     * Mock implementation of scheduling a calendar appointment.
     * Updates customer profile metadata in the DB.
     */
    static async bookAppointment(args) {
        console.log(`[Tool: bookAppointment] Scheduling for ${args.customerName} at ${args.dateTime}`);
        const conversation = await client_1.prisma.conversation.findUnique({
            where: { id: args.conversationId },
            include: { customer: true }
        });
        if (!conversation) {
            throw new Error(`Conversation not found: ${args.conversationId}`);
        }
        const existingMetadata = conversation.customer.metadata || {};
        const updatedMetadata = {
            ...existingMetadata,
            appointmentDate: args.dateTime,
            appointmentName: args.customerName,
            lastInteractionTool: 'bookAppointment'
        };
        const updatedCustomer = await client_1.prisma.customer.update({
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
        return {
            success: true,
            message: `Appointment scheduled successfully for ${args.customerName} on ${args.dateTime}.`,
            data: { appointmentDate: args.dateTime }
        };
    }
    /**
     * Mock implementation of exporting lead details to CRM/Google Sheet.
     */
    static async exportToSheet(args) {
        console.log(`[Tool: exportToSheet] Exporting lead data:`, args.leadData);
        const conversation = await client_1.prisma.conversation.findUnique({
            where: { id: args.conversationId },
            include: { customer: true }
        });
        if (!conversation) {
            throw new Error(`Conversation not found: ${args.conversationId}`);
        }
        const existingMetadata = conversation.customer.metadata || {};
        const updatedMetadata = {
            ...existingMetadata,
            exportedToSheet: true,
            exportedAt: new Date().toISOString(),
            leadDetails: {
                ...(existingMetadata.leadDetails || {}),
                ...args.leadData
            }
        };
        const updatedCustomer = await client_1.prisma.customer.update({
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
        return {
            success: true,
            message: `Lead metrics successfully exported to sheet storage.`,
            exportedData: args.leadData
        };
    }
    /**
     * Transfer conversation to human support.
     */
    static async transferToHuman(args) {
        console.log(`[Tool: transferToHuman] Handoff requested for conversation: ${args.conversationId}`);
        const updatedConversation = await client_1.prisma.conversation.update({
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
        return {
            success: true,
            message: `Conversation transferred to human queue. The AI responder has paused.`,
            conversationStatus: 'HUMAN_PENDING'
        };
    }
}
exports.ToolService = ToolService;
