/**
 * AI Service - Main AI orchestration service
 */

import OpenAI from 'openai';
import db from '../../database/db';
import { AIToolsService, aiToolsService } from './AIToolsService';
import { aiUsageTracker, AIFeature, AIModel } from './AIUsageTracker';
import {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  SmartAssignmentRequest,
  SmartAssignmentResponse,
  WriteAssistRequest,
  WriteAssistResponse,
  WritingContext,
  TeamCapacityAnalysis,
} from '../../types/ai';

export class AIService {
  private openai: OpenAI;
  private toolsService: AIToolsService;

  constructor(toolsService: AIToolsService = aiToolsService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.toolsService = toolsService;
  }

  /**
   * Simple chat without memory
   */
  async chat(message: string, context?: string): Promise<string> {
    const systemPrompt = `Kamu adalah asisten AI untuk sistem manajemen maintenance dan produksi pabrik thermoforming.
Selalu jawab dalam Bahasa Indonesia yang profesional dan ramah.
${context ? `Konteks: ${context}` : ''}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || '';
  }

  /**
   * Chat with memory (conversation history)
   */
  async chatWithMemory(
    userId: number,
    message: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    // Get or create conversation
    const conversation = conversationId
      ? this.getConversation(conversationId)
      : this.createConversation(userId);

    // Add user message
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `Kamu adalah asisten AI untuk sistem manajemen maintenance dan produksi.
Kamu membantu user dengan pertanyaan tentang tiket, work order, downtime, dan analisis data.
Selalu jawab dalam Bahasa Indonesia yang profesional.`,
      },
      ...conversation.messages,
      { role: 'user', content: message },
    ];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 800,
    });

    const assistantMessage = response.choices[0].message.content || '';

    // Update conversation
    conversation.messages.push(
      { role: 'user', content: message },
      { role: 'assistant', content: assistantMessage }
    );
    this.saveConversation(conversation);

    return {
      success: true,
      response: assistantMessage,
      conversationId: conversation.id,
    };
  }

  /**
   * Smart chat with function calling (tools)
   */
  async smartChat(userId: number, message: string): Promise<ChatResponse> {
    const tools = this.toolsService.getToolDefinitions();
    const toolsUsed: string[] = [];
    const startTime = Date.now();
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const messages: any[] = [
      {
        role: 'system',
        content: `Kamu adalah asisten AI pintar untuk sistem manajemen maintenance dan produksi pabrik thermoforming.
Kamu memiliki akses ke berbagai tools untuk mengquery data real-time dari database.
Gunakan tools yang tersedia untuk mendapatkan data sebelum menjawab pertanyaan user.
Selalu jawab dalam Bahasa Indonesia yang profesional dan informatif.
Jika user bertanya tentang data (tiket, work order, downtime, dll), gunakan tools untuk mendapatkan data terbaru.`,
      },
      { role: 'user', content: message },
    ];

    try {
      // First call - may trigger function calls
      let response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        tools: tools as any,
        tool_choice: 'auto',
        temperature: 0.5,
        max_tokens: 1500,
      });

      // Track token usage
      const firstUsage = aiUsageTracker.extractTokenUsage(response);
      totalInputTokens += firstUsage.inputTokens;
      totalOutputTokens += firstUsage.outputTokens;

      let responseMessage = response.choices[0].message;

      // Handle function calls
      while (responseMessage.tool_calls) {
        // Process each tool call
        for (const toolCall of responseMessage.tool_calls) {
          // Type guard for function tool calls
          if (toolCall.type !== 'function') continue;
          const functionName = (toolCall as { function: { name: string; arguments: string } }).function.name;
          const functionArgs = JSON.parse((toolCall as { function: { name: string; arguments: string } }).function.arguments);

          console.log(`Executing tool: ${functionName}`, functionArgs);
          toolsUsed.push(functionName);

          const result = await this.toolsService.executeTool(functionName, functionArgs);

          messages.push(responseMessage);
          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result.success ? result.data : { error: result.error }),
          });
        }

        // Get next response
        response = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages,
          tools: tools as any,
          tool_choice: 'auto',
          temperature: 0.5,
          max_tokens: 1500,
        });

        // Track additional token usage
        const additionalUsage = aiUsageTracker.extractTokenUsage(response);
        totalInputTokens += additionalUsage.inputTokens;
        totalOutputTokens += additionalUsage.outputTokens;

        responseMessage = response.choices[0].message;
      }

      // Log successful usage
      aiUsageTracker.logUsage({
        userId,
        feature: 'chatbot',
        model: 'gpt-3.5-turbo',
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        responseTimeMs: Date.now() - startTime,
        success: true,
      });

      return {
        success: true,
        response: responseMessage.content || '',
        toolsUsed,
      };
    } catch (error: any) {
      // Log error
      aiUsageTracker.logUsage({
        userId,
        feature: 'chatbot',
        model: 'gpt-3.5-turbo',
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage: error?.message || 'Smart chat error',
      });
      throw error;
    }
  }

  /**
   * Smart assignment recommendation
   */
  async getSmartAssignment(request: SmartAssignmentRequest): Promise<SmartAssignmentResponse> {
    // Get available technicians with their workload
    const technicians = db
      .prepare(
        `
      SELECT 
        u.id, u.name, u.department_id,
        COUNT(DISTINCT ta.ticket_id) as current_tickets,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'done' AND date(t.updated_at) >= date('now', '-30 days') THEN 1 ELSE 0 END) as completed_month
      FROM users u
      LEFT JOIN ticket_assignees ta ON u.id = ta.user_id
      LEFT JOIN tickets t ON ta.ticket_id = t.id
      WHERE u.role IN ('technician', 'operator')
      ${request.department_id ? 'AND u.department_id = ?' : ''}
      GROUP BY u.id
    `
      )
      .all(request.department_id ? [request.department_id] : []) as any[];

    if (technicians.length === 0) {
      return {
        success: false,
        recommendations: [],
        analysis: 'Tidak ada teknisi yang tersedia',
      };
    }

    // Build context for AI
    const techContext = technicians
      .map(
        t =>
          `${t.name}: ${t.current_tickets} tiket aktif, ${t.in_progress} in progress, ${t.completed_month} selesai bulan ini`
      )
      .join('\n');

    const prompt = `Analisis dan rekomendasikan teknisi terbaik untuk tiket berikut:

Tiket:
- Judul: ${request.title}
- Tipe: ${request.type}
- Prioritas: ${request.priority}
${request.description ? `- Deskripsi: ${request.description}` : ''}

Teknisi tersedia:
${techContext}

Berikan rekomendasi 3 teknisi terbaik dengan format JSON:
{
  "recommendations": [
    {"user_id": number, "user_name": "string", "score": number (1-100), "reasons": ["string"]},
    ...
  ],
  "analysis": "string"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Kamu adalah sistem rekomendasi cerdas untuk assignment tiket. Jawab HANYA dengan JSON valid.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    try {
      const content = response.choices[0].message.content || '{}';
      const result = JSON.parse(content.replace(/```json?\n?|\n?```/g, ''));
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      console.error('Parse smart assignment response error:', error);
      return {
        success: false,
        recommendations: [],
        analysis: 'Gagal memparse respons AI',
      };
    }
  }

  /**
   * Writing assistant
   */
  async writeAssist(request: WriteAssistRequest): Promise<WriteAssistResponse> {
    const typeInstructions: Record<string, string> = {
      ticket_title: 'Buat judul tiket yang jelas dan deskriptif (maks 100 karakter)',
      ticket_description: 'Buat deskripsi tiket yang detail dan terstruktur dalam HTML',
      wo_description: `Buat deskripsi work order maintenance yang detail dalam HTML. 
                       Sertakan scope pekerjaan, langkah-langkah, dan safety notes jika relevan. 
                       JANGAN gunakan tag <html>, <head>, <title>, <meta>, atau <body>. 
                       Langsung mulai dengan konten seperti <h2>, <p>, <ul>, dll.`,
      comment: 'Buat komentar/update yang profesional dan informatif',
      solution: 'Buat deskripsi solusi/root cause yang jelas',
      report: 'Buat laporan yang terstruktur',
    };

    const instruction = request.type
      ? typeInstructions[request.type]
      : 'Bantu menulis teks profesional';

    // Build rich context string
    let richContextStr = '';
    if (request.richContext) {
      const ctx = request.richContext;
      if (ctx.ticket) {
        richContextStr += `\n\nKonteks Tiket:
- Nomor: ${ctx.ticket.ticket_number}
- Judul: ${ctx.ticket.title}
- Status: ${ctx.ticket.status}
- Prioritas: ${ctx.ticket.priority}`;
        if (ctx.ticket.description) {
          richContextStr += `\n- Deskripsi: ${ctx.ticket.description}`;
        }
      }
      if (ctx.asset) {
        richContextStr += `\n\nKonteks Asset:
- Nama: ${ctx.asset.name}
- Kode: ${ctx.asset.code}`;
        if (ctx.asset.category) richContextStr += `\n- Kategori: ${ctx.asset.category}`;
      }
      if (ctx.recentWorkOrders && ctx.recentWorkOrders.length > 0) {
        richContextStr += `\n\nHistori Work Order Terkait (${ctx.recentWorkOrders.length} terbaru):`;
        ctx.recentWorkOrders.slice(0, 3).forEach(wo => {
          richContextStr += `\n- ${wo.wo_number}: ${wo.title} (${wo.status})`;
          if (wo.root_cause) richContextStr += ` - Root cause: ${wo.root_cause}`;
          if (wo.solution) richContextStr += ` - Solusi: ${wo.solution}`;
        });
      }
      if (ctx.commonIssues && ctx.commonIssues.length > 0) {
        richContextStr += `\n\nMasalah Umum Asset: ${ctx.commonIssues.join(', ')}`;
      }
    }

    const systemPrompt = `Kamu adalah asisten penulisan untuk sistem manajemen maintenance dan produksi.
Selalu jawab dalam Bahasa Indonesia yang profesional.
${instruction}
${request.context ? `Konteks Tambahan: ${request.context}` : ''}
${richContextStr}`;

    const startTime = Date.now();
    const userId = (request as any).userId || 0;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: request.prompt },
        ],
        temperature: 0.5,
        max_tokens: 1000,
      });

      // Track AI usage
      const usage = aiUsageTracker.extractTokenUsage(response);
      aiUsageTracker.logUsage({
        userId,
        feature: 'writing_assistant',
        model: 'gpt-3.5-turbo',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        responseTimeMs: Date.now() - startTime,
        success: true,
      });

      // Sanitize HTML output
      let result = response.choices[0].message.content || '';
      result = this.sanitizeHtml(result);

      return {
        success: true,
        result,
        type: request.type,
      };
    } catch (error: any) {
      // Track error
      aiUsageTracker.logUsage({
        userId,
        feature: 'writing_assistant',
        model: 'gpt-3.5-turbo',
        inputTokens: 0,
        outputTokens: 0,
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage: error?.message || 'Writing assistant error',
      });
      throw error;
    }
  }

  /**
   * Get writing context from database
   */
  async getWritingContext(params: {
    ticket_id?: number;
    asset_id?: number;
    work_order_id?: number;
  }): Promise<WritingContext> {
    const context: WritingContext = {};

    // Get ticket context
    if (params.ticket_id) {
      const ticket = db
        .prepare(
          `
        SELECT id, ticket_key, title, description, status, priority
        FROM tickets WHERE id = ?
      `
        )
        .get(params.ticket_id) as any;

      if (ticket) {
        const recentComments = db
          .prepare(
            `
          SELECT content FROM comments 
          WHERE ticket_id = ? 
          ORDER BY created_at DESC LIMIT 3
        `
          )
          .all(params.ticket_id) as any[];

        context.ticket = {
          id: ticket.id,
          ticket_number: ticket.ticket_key,
          title: ticket.title,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          recent_comments: recentComments.map(c => c.content),
        };
      }
    }

    // Get asset context
    if (params.asset_id) {
      const asset = db
        .prepare(
          `
        SELECT a.id, a.name, a.asset_code, ac.name as category, a.model, a.manufacturer, a.specifications
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        WHERE a.id = ?
      `
        )
        .get(params.asset_id) as any;

      if (asset) {
        context.asset = {
          id: asset.id,
          name: asset.name,
          code: asset.asset_code,
          category: asset.category || 'Uncategorized',
          specifications: asset.specifications,
        };

        // Get recent work orders for this asset
        const recentWOs = db
          .prepare(
            `
          SELECT wo_number, title, status, root_cause, solution
          FROM work_orders
          WHERE asset_id = ?
          ORDER BY created_at DESC
          LIMIT 5
        `
          )
          .all(params.asset_id) as any[];

        context.recentWorkOrders = recentWOs;

        // Get common issues
        const commonIssues = db
          .prepare(
            `
          SELECT reason, COUNT(*) as count
          FROM downtime_logs
          WHERE asset_id = ? AND reason IS NOT NULL AND reason != ''
          GROUP BY reason
          ORDER BY count DESC
          LIMIT 5
        `
          )
          .all(params.asset_id) as any[];

        context.commonIssues = commonIssues.map(i => i.reason);
      }
    }

    // Get work order context
    if (params.work_order_id) {
      const wo = db
        .prepare(
          `
        SELECT id, wo_number, title, status
        FROM work_orders WHERE id = ?
      `
        )
        .get(params.work_order_id) as any;

      if (wo) {
        context.workOrder = wo;
      }
    }

    return context;
  }

  /**
   * Get team capacity analysis
   */
  async getTeamCapacityAnalysis(): Promise<TeamCapacityAnalysis> {
    const workload = this.toolsService.getTeamWorkload();

    const prompt = `Analisis beban kerja tim berikut dan berikan rekomendasi:

${workload
  .map(
    (w: any) =>
      `${w.user_name} (${w.role}): ${w.assigned_tickets} tiket, ${w.in_progress} in progress, ${w.completed_this_week} selesai minggu ini`
  )
  .join('\n')}

Berikan analisis singkat dan 3 rekomendasi untuk optimasi beban kerja.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah analis manajemen tim yang memberikan insight berguna.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const analysis = response.choices[0].message.content || '';
    const recommendations = analysis
      .split('\n')
      .filter(line => line.trim().match(/^[0-9]+\./))
      .slice(0, 3);

    return {
      team: workload,
      recommendations: recommendations.length > 0 ? recommendations : [analysis],
    };
  }

  // ============================================
  // Legacy Methods (for frontend compatibility)
  // ============================================

  /**
   * Analyze ticket and suggest epic, type, priority
   */
  async analyzeTicket(
    title: string,
    description?: string
  ): Promise<{
    suggested_type: string;
    suggested_priority: string;
    suggested_epic_key?: string;
    suggested_epic_title?: string;
    is_new_epic: boolean;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  }> {
    // Get existing epics for context
    const epics = db
      .prepare(`SELECT id, ticket_key, title FROM tickets WHERE type = 'epic' AND status != 'done' ORDER BY created_at DESC LIMIT 10`)
      .all() as any[];

    const prompt = `Analisis ticket berikut dan tentukan:
1. Tipe yang tepat (bug, task, story, epic)
2. Prioritas (low, medium, high, critical)
3. Apakah perlu parent epic

Judul: ${title}
${description ? `Deskripsi: ${description}` : ''}

Epics yang ada:
${epics.map(e => `- ${e.ticket_key}: ${e.title}`).join('\n') || 'Tidak ada epic'}

Berikan respons dalam format JSON:
{
  "suggested_type": "task",
  "suggested_priority": "medium",
  "suggested_epic_key": "EPIC-001 atau null",
  "is_new_epic": false,
  "confidence": "high",
  "reasoning": "Alasan singkat"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah sistem analisis ticket. Selalu berikan respons dalam format JSON valid.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        // Find epic title if key provided
        if (result.suggested_epic_key) {
          const epic = epics.find(e => e.ticket_key === result.suggested_epic_key);
          if (epic) {
            result.suggested_epic_title = epic.title;
          }
        }
        return result;
      }
    } catch (error) {
      console.error('Analyze ticket error:', error);
    }

    // Default response
    return {
      suggested_type: 'task',
      suggested_priority: 'medium',
      is_new_epic: false,
      confidence: 'low',
      reasoning: 'Tidak dapat menganalisis ticket',
    };
  }

  /**
   * Auto-generate description from title
   */
  async autocompleteDescription(title: string, ticketType?: string): Promise<string> {
    const typeContext = {
      bug: 'Ini adalah laporan bug. Jelaskan langkah reproduksi, expected behavior, dan actual behavior.',
      task: 'Ini adalah task/pekerjaan. Jelaskan acceptance criteria dan langkah-langkah yang diperlukan.',
      story: 'Ini adalah user story. Gunakan format "Sebagai [role], saya ingin [goal], sehingga [benefit]".',
      epic: 'Ini adalah epic besar. Jelaskan goal utama, scope, dan deliverables yang diharapkan.',
    };

    const prompt = `Buat deskripsi profesional untuk ticket berikut:

Judul: ${title}
Tipe: ${ticketType || 'task'}

${typeContext[ticketType as keyof typeof typeContext] || typeContext.task}

Buat deskripsi yang jelas, terstruktur, dan actionable dalam Bahasa Indonesia.
Gunakan format HTML sederhana (bold, list) untuk struktur.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah technical writer yang membuat deskripsi ticket yang jelas dan terstruktur.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || '';
      return this.sanitizeHtml(content);
    } catch (error) {
      console.error('Autocomplete description error:', error);
      return '';
    }
  }

  /**
   * Enhance/improve text
   */
  async enhanceText(
    title?: string,
    description?: string,
    ticketType?: string
  ): Promise<{ title?: string; description?: string; changes: string[] }> {
    const prompt = `Perbaiki dan tingkatkan kualitas teks berikut untuk ticket ${ticketType || 'task'}:

${title ? `Judul: ${title}` : ''}
${description ? `Deskripsi: ${description}` : ''}

Berikan versi yang lebih baik dengan:
1. Judul yang jelas dan deskriptif
2. Deskripsi yang terstruktur dan lengkap
3. Format HTML untuk struktur

Respons dalam JSON:
{
  "title": "judul yang diperbaiki",
  "description": "deskripsi yang diperbaiki (HTML)",
  "changes": ["perubahan 1", "perubahan 2"]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah editor profesional. Berikan respons dalam JSON valid.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        if (result.description) {
          result.description = this.sanitizeHtml(result.description);
        }
        return result;
      }
    } catch (error) {
      console.error('Enhance text error:', error);
    }

    return { title, description, changes: [] };
  }

  /**
   * Format text based on type
   */
  async formatText(text: string, formatType: string, language: string = 'id'): Promise<string> {
    const formatGuides: Record<string, string> = {
      ticket_description: 'Format sebagai deskripsi ticket teknis dengan sections: Summary, Steps, Expected Result.',
      work_order_description: 'Format sebagai work order maintenance dengan: Masalah, Lokasi, Tindakan yang diperlukan.',
      comment: 'Format sebagai komentar profesional yang ringkas.',
      report: 'Format sebagai laporan formal dengan struktur yang jelas.',
      checklist: 'Konversi menjadi checklist dengan bullet points.',
      improve: 'Perbaiki grammar, ejaan, dan kejelasan tanpa mengubah makna.',
    };

    const prompt = `${formatGuides[formatType] || formatGuides.improve}

Teks asli:
${text}

Bahasa output: ${language === 'id' ? 'Bahasa Indonesia' : 'English'}
Format output: HTML sederhana (bold, list, paragraph)`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah formatter teks profesional. Output hanya teks yang sudah diformat.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0].message.content || '';
      return this.sanitizeHtml(content);
    } catch (error) {
      console.error('Format text error:', error);
      return text;
    }
  }

  /**
   * Get context-aware suggestions
   */
  async getSuggestions(
    page: string,
    entityId?: string | number,
    entityType?: string,
    context?: string
  ): Promise<{ suggestions: string[]; actions: Array<{ label: string; type: string; data?: any }> }> {
    // Get context based on page
    let pageContext = '';

    if (page === 'tickets' || page === 'ticket-detail') {
      const recentTickets = db
        .prepare(`SELECT title, status FROM tickets ORDER BY created_at DESC LIMIT 5`)
        .all() as any[];
      pageContext = `Ticket terbaru: ${recentTickets.map(t => t.title).join(', ')}`;
    } else if (page === 'work-orders' || page === 'work-order-detail') {
      const activeWOs = db
        .prepare(`SELECT wo_number, title, status FROM work_orders WHERE status IN ('open', 'in_progress') LIMIT 5`)
        .all() as any[];
      pageContext = `WO aktif: ${activeWOs.map(w => `${w.wo_number}: ${w.title}`).join(', ')}`;
    } else if (page === 'downtime') {
      const activeDowntime = db
        .prepare(`SELECT COUNT(*) as count FROM downtime_logs WHERE end_time IS NULL`)
        .get() as any;
      pageContext = `Downtime aktif: ${activeDowntime?.count || 0}`;
    }

    const prompt = `Berikan 3 saran aksi yang relevan untuk halaman "${page}".
${pageContext}
${context ? `Konteks tambahan: ${context}` : ''}

Format JSON:
{
  "suggestions": ["saran 1", "saran 2", "saran 3"],
  "actions": [
    {"label": "Label tombol", "type": "create_ticket|start_wo|view_report", "data": {}}
  ]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah asisten yang memberikan saran aksi relevan. Respons dalam JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 300,
      });

      const content = response.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Get suggestions error:', error);
    }

    return {
      suggestions: ['Tidak ada saran khusus saat ini'],
      actions: [],
    };
  }

  // ============================================
  // Preventive Maintenance AI Suggestions
  // ============================================

  /**
   * Get AI suggestions for PM schedule including checklist and analysis
   */
  async getPMSuggestions(data: {
    asset_id: number;
    title?: string;
    frequency_type?: string;
  }): Promise<{
    checklist: string[];
    analysis: {
      downtime_summary: string;
      common_issues: string[];
      recommendation: string;
      suggested_frequency?: string;
      suggested_duration?: number;
    };
    description_suggestion?: string;
  }> {
    try {
      // Get asset information
      const asset = db.prepare(`
        SELECT a.*, ac.name as category_name
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        WHERE a.id = ?
      `).get(data.asset_id) as any;

      if (!asset) {
        return this.getDefaultPMSuggestions();
      }

      // Get downtime history for this asset (last 6 months)
      const downtimeHistory = db.prepare(`
        SELECT 
          dl.id,
          dl.reason,
          dl.duration_minutes,
          dl.downtime_type,
          dc.name as classification_name,
          dc.category as classification_category,
          fc.code as failure_code,
          fc.description as failure_description,
          dl.start_time
        FROM downtime_logs dl
        LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
        LEFT JOIN failure_codes fc ON dl.failure_code_id = fc.id
        WHERE dl.asset_id = ?
          AND dl.start_time >= datetime('now', '-6 months')
        ORDER BY dl.start_time DESC
        LIMIT 20
      `).all(data.asset_id) as any[];

      // Get work order history
      const woHistory = db.prepare(`
        SELECT 
          wo.title,
          wo.type,
          wo.description,
          wo.labor_hours,
          wo.actual_start,
          wo.actual_end
        FROM work_orders wo
        WHERE wo.asset_id = ?
          AND wo.created_at >= datetime('now', '-6 months')
        ORDER BY wo.created_at DESC
        LIMIT 15
      `).all(data.asset_id) as any[];

      // Calculate downtime statistics
      const totalDowntime = downtimeHistory.reduce((sum, d) => sum + (d.duration_minutes || 0), 0);
      const avgDowntime = downtimeHistory.length > 0 ? totalDowntime / downtimeHistory.length : 0;
      const unplannedCount = downtimeHistory.filter(d => d.downtime_type === 'unplanned').length;

      // Group issues by failure code
      const issueGroups: Record<string, number> = {};
      downtimeHistory.forEach(d => {
        const key = d.failure_description || d.reason || 'Unknown';
        issueGroups[key] = (issueGroups[key] || 0) + 1;
      });
      const commonIssues = Object.entries(issueGroups)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([issue]) => issue);

      // Frequency-specific guidance
      const frequencyGuidance: Record<string, string> = {
        daily: `PM HARIAN - Fokus pada:
- Inspeksi visual cepat (5-10 menit)
- Pengecekan safety device
- Pembersihan area kerja
- Pengecekan level oli/lubrikasi
- Monitoring suhu dan getaran
- Pengecekan panel kontrol`,
        weekly: `PM MINGGUAN - Fokus pada:
- Pembersihan menyeluruh komponen
- Pengecekan belt dan chain tension
- Lubrikasi bearing dan moving parts
- Pengecekan filter udara/oli
- Test safety interlock
- Inspeksi kabel dan koneksi`,
        monthly: `PM BULANAN - Fokus pada:
- Penggantian filter (jika perlu)
- Kalibrasi sensor dan instrument
- Pengecekan alignment dan leveling
- Inspeksi seal dan gasket
- Pengecekan sistem pneumatik/hidrolik
- Test fungsi emergency stop
- Backup parameter mesin`,
        quarterly: `PM KUARTALAN - Fokus pada:
- Penggantian oli dan lubricant
- Inspeksi bearing dan gearbox
- Pengecekan motor dan drive system
- Inspeksi struktur dan frame
- Pengecekan sistem cooling
- Kalibrasi lengkap
- Review maintenance history`,
        yearly: `PM TAHUNAN (OVERHAUL) - Fokus pada:
- Overhaul komponen utama
- Penggantian bearing dan seal
- Rekondisi/penggantian komponen aus
- Painting dan coating ulang
- Upgrade firmware/software
- Full system calibration
- Documentation update
- Compliance inspection`,
        runtime_hours: `PM BERBASIS JAM OPERASI - Fokus pada:
- Komponen yang aus berdasarkan jam kerja
- Penggantian consumable parts
- Inspeksi wear indicators
- Pengecekan cycle counter`
      };

      const frequencyType = data.frequency_type || 'monthly';
      const guidance = frequencyGuidance[frequencyType] || frequencyGuidance.monthly;

      const startTime = Date.now();
      const userId = (data as any).userId || 0;

      // Build prompt for AI
      const prompt = `Kamu adalah expert maintenance engineer untuk mesin industri thermoforming/packaging.

ASSET INFORMATION:
- Kode: ${asset.asset_code}
- Nama: ${asset.name}
- Kategori: ${asset.category_name || 'N/A'}
- Lokasi: ${asset.location || 'N/A'}
- Model: ${asset.model || 'N/A'}
- Manufacturer: ${asset.manufacturer || 'N/A'}

PM SCHEDULE YANG AKAN DIBUAT:
- Judul: ${data.title || 'Preventive Maintenance'}
- Frekuensi: ${frequencyType}

PANDUAN CHECKLIST BERDASARKAN FREKUENSI:
${guidance}

RIWAYAT DOWNTIME (6 bulan terakhir):
- Total kejadian: ${downtimeHistory.length}
- Total durasi: ${Math.round(totalDowntime / 60)} jam
- Rata-rata durasi: ${Math.round(avgDowntime)} menit
- Unplanned downtime: ${unplannedCount} kejadian
- Masalah umum: ${commonIssues.join(', ') || 'Tidak ada data'}

RIWAYAT WORK ORDER:
${woHistory.slice(0, 5).map(wo => `- ${wo.type}: ${wo.title}`).join('\n') || 'Tidak ada data'}

PENTING: Checklist HARUS sesuai dengan frekuensi "${frequencyType}". 
- Untuk PM harian: item sederhana, cepat (5-15 menit total)
- Untuk PM mingguan: item lebih detail (30-60 menit total)
- Untuk PM bulanan: item komprehensif (1-2 jam total)
- Untuk PM kuartalan: item mendalam (2-4 jam total)
- Untuk PM tahunan: item overhaul lengkap (4-8 jam total)

Berdasarkan data di atas, berikan:
1. Checklist PM yang SPESIFIK untuk frekuensi ${frequencyType} (5-10 item)
2. Analisis kondisi aset berdasarkan riwayat downtime
3. Apakah frekuensi ${frequencyType} sudah optimal atau perlu diubah
4. Estimasi durasi PM yang realistis (dalam menit)
5. Deskripsi singkat untuk jadwal PM ini

Format respons dalam JSON:
{
  "checklist": ["item 1", "item 2", ...],
  "analysis": {
    "downtime_summary": "ringkasan kondisi downtime",
    "common_issues": ["masalah 1", "masalah 2"],
    "recommendation": "rekomendasi lengkap",
    "suggested_frequency": "daily|weekly|monthly|quarterly|yearly",
    "suggested_duration": 60
  },
  "description_suggestion": "deskripsi untuk PM ini"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah expert maintenance engineer. Berikan saran PM yang praktis dan spesifik. Respons hanya dalam format JSON yang valid.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      // Track AI usage
      const usage = aiUsageTracker.extractTokenUsage(response);
      aiUsageTracker.logUsage({
        userId,
        feature: 'pm_suggestion',
        model: 'gpt-3.5-turbo',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        responseTimeMs: Date.now() - startTime,
        success: true,
      });

      const content = response.choices[0].message.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          checklist: result.checklist || [],
          analysis: {
            downtime_summary: result.analysis?.downtime_summary || 'Tidak ada data downtime',
            common_issues: result.analysis?.common_issues || commonIssues,
            recommendation: result.analysis?.recommendation || '',
            suggested_frequency: result.analysis?.suggested_frequency,
            suggested_duration: result.analysis?.suggested_duration,
          },
          description_suggestion: result.description_suggestion,
        };
      }
    } catch (error: any) {
      // Track error if userId is available
      if ((data as any).userId) {
        aiUsageTracker.logUsage({
          userId: (data as any).userId,
          feature: 'pm_suggestion',
          model: 'gpt-3.5-turbo',
          inputTokens: 0,
          outputTokens: 0,
          responseTimeMs: 0,
          success: false,
          errorMessage: error?.message || 'Get PM suggestions error',
        });
      }
      console.error('Get PM suggestions error:', error);
    }

    return this.getDefaultPMSuggestions(data.frequency_type || 'monthly');
  }

  private getDefaultPMSuggestions(frequencyType: string = 'monthly') {
    // Frequency-specific default checklists
    const defaultChecklists: Record<string, string[]> = {
      daily: [
        'Inspeksi visual kondisi mesin',
        'Cek panel kontrol dan indicator',
        'Periksa level oli/lubrikasi',
        'Bersihkan area kerja',
        'Cek safety device aktif',
      ],
      weekly: [
        'Pembersihan menyeluruh komponen',
        'Cek tension belt/chain',
        'Lubrikasi bearing dan moving parts',
        'Periksa filter udara',
        'Test safety interlock',
        'Inspeksi kabel dan koneksi',
      ],
      monthly: [
        'Periksa kondisi visual mesin',
        'Cek level oli dan lubrikasi',
        'Periksa filter dan bersihkan/ganti jika perlu',
        'Cek koneksi elektrikal',
        'Kalibrasi sensor',
        'Periksa seal dan gasket',
        'Test emergency stop',
        'Backup parameter mesin',
      ],
      quarterly: [
        'Penggantian oli lubrikasi',
        'Inspeksi bearing dan gearbox',
        'Periksa motor dan drive system',
        'Inspeksi struktur dan frame',
        'Cek sistem cooling',
        'Kalibrasi lengkap instrument',
        'Review maintenance history',
        'Update documentation',
      ],
      yearly: [
        'Overhaul komponen utama',
        'Penggantian bearing dan seal',
        'Rekondisi komponen aus',
        'Full system calibration',
        'Painting dan coating ulang',
        'Upgrade firmware/software',
        'Compliance inspection',
        'Update asset documentation',
        'Review dan update PM schedule',
      ],
    };

    const durations: Record<string, number> = {
      daily: 15,
      weekly: 45,
      monthly: 90,
      quarterly: 180,
      yearly: 480,
    };

    return {
      checklist: defaultChecklists[frequencyType] || defaultChecklists.monthly,
      analysis: {
        downtime_summary: 'Tidak ada data downtime untuk analisis',
        common_issues: [],
        recommendation: 'Lakukan PM rutin sesuai jadwal manufacturer',
        suggested_frequency: frequencyType,
        suggested_duration: durations[frequencyType] || 90,
      },
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getConversation(id: string): any {
    const row = db.prepare('SELECT * FROM chat_memory WHERE id = ?').get(id) as any;
    if (row) {
      return {
        id: row.id,
        user_id: row.user_id,
        messages: JSON.parse(row.messages || '[]'),
        created_at: row.created_at,
        updated_at: row.updated_at,
      };
    }
    return this.createConversation(0);
  }

  private createConversation(userId: number): any {
    const id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.run(
      `
      INSERT INTO chat_memory (id, user_id, messages, created_at, updated_at)
      VALUES (?, ?, '[]', datetime('now'), datetime('now'))
    `,
      [id, userId]
    );
    return { id, user_id: userId, messages: [] };
  }

  private saveConversation(conversation: any): void {
    db.run(
      `
      UPDATE chat_memory 
      SET messages = ?, updated_at = datetime('now')
      WHERE id = ?
    `,
      [JSON.stringify(conversation.messages.slice(-20)), conversation.id]
    );
  }

  private sanitizeHtml(html: string): string {
    return html
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '')
      .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .trim();
  }
}

// Export singleton
export const aiService = new AIService();
export default aiService;
