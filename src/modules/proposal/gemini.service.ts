import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ProposalRequestDto, ProposalResponseDto, FullProposalResponse, SourceAttribution } from './proposal.dto';

// Configuration
const MODEL_NAME = 'gemini-2.5-flash-preview-09-2025';
// *** ИСПРАВЛЕНО: Удалено некорректное форматирование Markdown из URL. ***
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Utility for exponential backoff retry logic
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 5): Promise<Response> {
  let attempt = 0;
  while (attempt < maxRetries) {
    let response: Response;
    try {
      response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      
      // --- START: Detailed Error Extraction for 4xx/5xx responses ---
      let errorBody = `API returned status ${response.status}.`;
      try {
          // Attempt to read and parse the error body for a detailed message
          const errorJson = await response.json();
          // Extract the error message if structured as per Google API standard
          if (errorJson.error && errorJson.error.message) {
              errorBody = errorJson.error.message;
          } else {
              // Fallback to the full JSON string if specific message path is not found
              errorBody = JSON.stringify(errorJson);
          }
      } catch (e) {
          // Ignore if body can't be read as JSON, use status
          errorBody = `API returned status ${response.status}. Body unreadable.`;
      }
      
      // Throw an error that includes the status code and the detailed message from the server
      throw new Error(`API returned status ${response.status}. Details: ${errorBody}`);
      // --- END: Detailed Error Extraction ---

    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) {
        // Log the final failed status code if available
        const status = response?.status || 'unknown';
        // Ensure we throw the detailed message from the server if we caught it
        throw new InternalServerErrorException(`Gemini API call failed after ${maxRetries} attempts: API returned status ${status}: ${error.message}`);
      }
      // Exponential backoff: 2^attempt * 100ms jitter
      const delay = Math.pow(2, attempt) * 100 + Math.random() * 100;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

@Injectable()
export class WeatherProposalService {
  private readonly logger = new Logger(WeatherProposalService.name);
  
  // Чтение ключа из переменной окружения
  private readonly apiKey = process.env.GEMINI_API_KEY; 

  /**
   * Calls the Gemini API to get a structured prediction for a proposal.
   */
  async getProposalPrediction(proposal: ProposalRequestDto): Promise<FullProposalResponse> {
    
    // Проверка: Ранний выход, если ключ не найден в окружении
    if (!this.apiKey) {
        this.logger.error("API Key is missing. Please ensure GEMINI_API_KEY is set in your environment (e.g., in a .env file) for local execution.");
        throw new InternalServerErrorException("API Key not configured. Authentication failed (403 Forbidden).");
    }
    
    const {
      roomCountMembers,
      proposedName,
      proposedAddress,
      proposedDateStart,
      proposedDateEnd,
    } = proposal;

    // 1. Define the System Instruction (Persona & Rules) - UPDATED FOR PURE JSON OUTPUT
    // Мы убрали responseMimeType, поэтому инструкция должна быть максимально строгой.
    const systemPrompt = `You are an expert event planning and logistics analyst. Your task is to analyze a proposed event and output ONLY a single, strict JSON object. 
    DO NOT include any markdown formatting (like \`\`\`json), commentary, or extra text.
    
    The JSON object MUST contain the following four keys:
    1. "long": number (The determined longitude of the proposed address. Use up to 7 decimal places.)
    2. "lat": number (The determined latitude of the proposed address. Use up to 7 decimal places.)
    3. "whether": string (A concise summary of the predicted weather and temperature for the date and location, IN RUSSIAN.)
    4. "prediction": string (A detailed prediction and grade (A-F) on the suitability of the proposal based on weather, group size, and date. The string MUST end with the final grade, e.g., '...поэтому, предложение получает оценку Grade B.', IN RUSSIAN.)`;

    // 2. Define the User Query (Specific Task)
    const userQuery = `Analyze this proposal for an event:
    - Name: "${proposedName}"
    - Address: "${proposedAddress}"
    - Start Time: ${proposedDateStart}
    - End Time: ${proposedDateEnd}
    - Group Size: ${roomCountMembers} members.
    Determine the coordinates, weather conditions, and suitability prediction with a grade, and output the result as a raw JSON object as defined in your instructions.`;


    // *** 3. УДАЛЕНА responseSchema и generationConfig, чтобы разрешить Tool Use ***
    const url = `${BASE_URL}/models/${MODEL_NAME}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      tools: [{ "google_search": {} }], // Enable Google Search grounding for real-time data
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const candidate = result.candidates?.[0];

      if (!candidate || !candidate.content?.parts?.[0]?.text) {
        this.logger.error('Gemini API returned no content or unexpected structure.', result);
        throw new InternalServerErrorException('Failed to get a valid response from the prediction model.');
      }

      const jsonText = candidate.content.parts[0].text;
      
      // Поскольку модель теперь выводит ЧИСТЫЙ JSON, мы парсим его напрямую.
      // Важно очистить вывод от возможных обрамляющих символов, если модель все-таки их добавила (например, ```json...)
      let cleanedJsonText = jsonText.trim();
      if (cleanedJsonText.startsWith('```json')) {
        cleanedJsonText = cleanedJsonText.substring('```json'.length).trim();
      }
      if (cleanedJsonText.endsWith('```')) {
        cleanedJsonText = cleanedJsonText.substring(0, cleanedJsonText.length - '```'.length).trim();
      }

      const parsedPrediction: ProposalResponseDto = JSON.parse(cleanedJsonText);

      // Extract Grounding Sources (for transparency)
      let sources: SourceAttribution[] = [];
      const groundingMetadata = candidate.groundingMetadata;
      if (groundingMetadata && groundingMetadata.groundingAttributions) {
          sources = groundingMetadata.groundingAttributions
              .map(attribution => ({
                  uri: attribution.web?.uri,
                  title: attribution.web?.title,
              }))
              .filter(source => source.uri && source.title); // Filter out potentially null/undefined sources
      }

      this.logger.log(`Successfully predicted proposal for: ${proposedName}`);
      
      // Combine the prediction data with the sources
      return { ...parsedPrediction, sources };

    } catch (error) {
      // Re-throw the error as a standard NestJS exception
      if (error instanceof InternalServerErrorException) {
          throw error;
      }
      this.logger.error('Error during Gemini API call', error.stack, error.message);
      throw new InternalServerErrorException('Error processing proposal prediction.');
    }
  }
}