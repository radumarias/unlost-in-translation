import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { history = [], sourceLanguage = 'English', targetLanguage = 'Spanish', currentInput, skipChecks = false, tone = 'Auto', situation = 'General' } = await req.json();

    if (!currentInput) {
      return Response.json({ error: 'Missing current input' }, { status: 400 });
    }

    let historyText = history.map((h: any) => `${h.speakerLang} Speaker: ${h.text}`).join('\n');
    if (!historyText) historyText = 'No prior history.';

    // FAST TRANSLATE (Skips intent checks entirely)
    if (skipChecks) {
      const result = await generateObject({
        model: google('gemini-2.5-flash'),
        system: `You are a fast translator. Translate the active speaker's message from ${sourceLanguage} to ${targetLanguage}. Use the conversation history for context if needed.\n\nConversation History:\n${historyText}\n\n3. Consider the context and tone constraints provided below.
          
          Constraints:
          - Target Language: ${targetLanguage}
          - Requested Tone: ${tone || 'Auto'}
          - Requested Situation/Context: ${situation || 'General'}

          When deciding on vocabulary and politeness levels, STRICTLY prioritize the constraints of the Requested Situation over general translation norms. E.g., if the situation is "Medical / Hospital", prioritize absolute precision and formal/objective terms even if the tone is "Casual". If the situation is "Emergency", translate rapidly with clear, concise, actionable phrasing.`,
        prompt: `Translate from ${sourceLanguage} to ${targetLanguage}: "${currentInput}"`,
        schema: z.object({
          translation: z.string().describe(`The ${targetLanguage} translation.`)
        })
      });
      return Response.json({ translation: result.object.translation });
    }

    // NORMAL (LOST IN TRANSLATION) CHECKS
    const systemPrompt = `You are a highly skilled cultural interpreter. Your goal is to prevent 'lost in translation' moments.
You are facilitating a conversation between two people. One speaks ${sourceLanguage} and the other speaks ${targetLanguage}.

Here is the conversation history so far:
${historyText}

The active speaker (${sourceLanguage} Speaker) just said: "${currentInput}"

Your task is to:
1. Translate this new message into ${targetLanguage}, taking into account the context above.
${tone !== 'Auto' ? `IMPORTANT: The requested conversation tone is "${tone}". The translation MUST reflect this tone accurately.` : ''}
${situation !== 'General' ? `IMPORTANT: The requested situation/context is "${situation}". STRICTLY prioritize vocabulary and politeness suited for this situation (e.g. absolute precision for Medical, rapid concise translation for Emergency).` : ''}
2. Provide a 'sanity check': a roundtrip back-translation explaining exactly how the ${targetLanguage} speaker will perceive the translation, written in ${sourceLanguage}.
3. If the message contains an idiom, slang, or concept that translates literally into something offensive or highly unnatural, provide a warning. Otherwise, warning should be null.`;

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Please process the active speaker's message: "${currentInput}"`,
      schema: z.object({
        translation: z.string().describe(`The ${targetLanguage} translation of the last message.`),
        sanity_check: z.string().describe(`The ${sourceLanguage} back-translation (roundtrip) of the ${targetLanguage} text, explaining the true perceived intent.`),
        warning: z.string().nullable().describe('Warning about cultural misunderstanding or offensive literal translation. Null if safe.'),
      }),
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Translation error:', error);
    return Response.json({ error: 'Failed to translate' }, { status: 500 });
  }
}
