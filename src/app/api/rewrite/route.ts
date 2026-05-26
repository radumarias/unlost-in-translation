import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { history = [], sourceLanguage = 'English', targetLanguage = 'Spanish', currentInput, warning, direction, tone = 'Auto', situation = 'General' } = await req.json();

    if (!currentInput) {
      return Response.json({ error: 'Missing current input' }, { status: 400 });
    }

    let historyText = history.map((h: any) => `${h.speakerLang} Speaker: ${h.text}`).join('\n');
    if (!historyText) historyText = 'No prior history.';

    const isInitial = !direction;

    const systemPrompt = `You are a highly skilled cultural interpreter.
You are facilitating a conversation between two people. One speaks ${sourceLanguage} and the other speaks ${targetLanguage}.

Here is the conversation history so far:
${historyText}

The active speaker (${sourceLanguage} Speaker) wants to say: "${currentInput}"

This message triggered the following cultural warning: "${warning || 'N/A'}"

CRITICAL INSTRUCTION: You MUST take this warning into account. Your suggested rewrite MUST completely resolve the issue described in the warning, while preserving the core intent of the message. The rewrite must be culturally safe and natural for a ${targetLanguage} speaker.

${isInitial 
  ? `Your task is to provide an initial suggested rewrite to fix the warning, and suggest 2 other alternative directions for rewriting.` 
  : `The user has requested you to rewrite their message using the following direction/style: "${direction}"\nYour task is to rewrite the user's message in ${sourceLanguage} according to the requested direction.`}
${tone !== 'Auto' ? `\nIMPORTANT: The requested conversation tone is "${tone}". The rewritten message MUST reflect this tone accurately.` : ''}
${situation !== 'General' ? `\nIMPORTANT: The requested situation/context is "${situation}". The rewritten message MUST be tailored to this specific situation in terms of vocabulary and politeness.` : ''}
`;

      const result = await generateObject({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        prompt: isInitial 
          ? `Please provide an initial rewrite for "${currentInput}" to resolve the warning, along with alternative directions.`
          : `Please rewrite "${currentInput}" with the direction: "${direction}"`,
        schema: isInitial 
          ? z.object({
              rewriteDirection: z.string().describe('A brief description of how you rewrote it (e.g. "More polite", "Avoid offensive slang").'),
              rewrittenSource: z.string().describe(`The rewritten message in ${sourceLanguage}.`),
              alternativeDirections: z.array(z.string()).describe('2 alternative ways to rewrite the message (e.g. ["More formal", "Adapt to local culture"]).'),
            })
          : z.object({
              rewrittenSource: z.string().describe(`The rewritten message in ${sourceLanguage}.`),
            }),
      });

    return Response.json(result.object);
  } catch (error) {
    console.error('Rewrite error:', error);
    return Response.json({ error: 'Failed to rewrite intent' }, { status: 500 });
  }
}
