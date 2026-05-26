import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { history = [], sourceLanguage = 'English', targetLanguage = 'Spanish', currentInput, tone = 'Auto' } = await req.json();

    if (!currentInput) {
      return Response.json({ error: 'Missing current input' }, { status: 400 });
    }

    let historyText = history.map((h: any) => `${h.speakerLang} Speaker: ${h.text}`).join('\n');
    if (!historyText) historyText = 'No prior history.';

    const systemPrompt = `You are a highly skilled cultural interpreter. Your goal is to prevent 'lost in translation' moments.
You are facilitating a conversation between two people. One speaks ${sourceLanguage} and the other speaks ${targetLanguage}.

Here is the conversation history so far:
${historyText}

The active speaker (${sourceLanguage} Speaker) just said: "${currentInput}"

Your task is to:
1. Mentally translate this new message into ${targetLanguage}.
${tone !== 'Auto' ? `IMPORTANT: The requested conversation tone is "${tone}". If the translated message violates this tone, you should consider that a cultural issue.` : ''}
2. Provide a 'sanity check': a roundtrip back-translation explaining exactly how the ${targetLanguage} speaker will perceive the translation, written in ${sourceLanguage}.
3. If the message contains an idiom, slang, or concept that translates literally into something offensive or highly unnatural, provide a warning. Otherwise, warning should be null.`;

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Please process the active speaker's message: "${currentInput}"`,
      schema: z.object({
        sanity_check: z.string().describe(`The ${sourceLanguage} back-translation (roundtrip) of the ${targetLanguage} text, explaining the true perceived intent.`),
        warning: z.string().nullable().describe('Warning about cultural misunderstanding or offensive literal translation. Null if safe.'),
      }),
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Intent error:', error);
    return Response.json({ error: 'Failed to analyze intent' }, { status: 500 });
  }
}
