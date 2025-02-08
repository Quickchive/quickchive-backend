export interface AiService {
  chat(chatRequest: {
    messages: any[];
    model: string;
    temperature: number;
    responseType: string;
  }): Promise<string | null>;
}

export const AiService = Symbol('AiService');
