import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { history = [], sourceLanguage = 'English', targetLanguage = 'Spanish', currentInput, skipChecks = false, tone = 'Auto', situation = 'General', isSourceAutoDetect = false } = await req.json();

    if (!currentInput) {
      return Response.json({ error: 'Missing current input' }, { status: 400 });
    }

    let historyText = history.map((h: any) => `${h.speakerLang} Speaker: ${h.text}`).join('\n');
    if (!historyText) historyText = 'No prior history.';

    // FAST TRANSLATE (Skips intent checks entirely)
    if (skipChecks) {
      const result = await generateObject({
        model: google('gemini-2.5-flash'),
        system: isSourceAutoDetect
          ? `You are a fast translator. Detect the language of the active speaker's message and translate it to ${targetLanguage}. Use the conversation history for context if needed.\n\nConversation History:\n${historyText}\n\n3. Consider the context and tone constraints provided below.\n          \n          Constraints:\n          - Target Language: ${targetLanguage}\n          - Requested Tone: ${tone || 'Auto'}\n          - Requested Situation/Context: ${situation || 'General'}\n\n          When deciding on vocabulary and politeness levels, STRICTLY prioritize the constraints of the Requested Situation over general translation norms. E.g., if the situation is "Medical / Hospital", prioritize absolute precision and formal/objective terms even if the tone is "Casual". If the situation is "Emergency", translate rapidly with clear, concise, actionable phrasing.`
          : `You are a fast translator. Translate the active speaker's message from ${sourceLanguage} to ${targetLanguage}. Use the conversation history for context if needed.\n\nConversation History:\n${historyText}\n\n3. Consider the context and tone constraints provided below.\n          \n          Constraints:\n          - Target Language: ${targetLanguage}\n          - Requested Tone: ${tone || 'Auto'}\n          - Requested Situation/Context: ${situation || 'General'}\n\n          When deciding on vocabulary and politeness levels, STRICTLY prioritize the constraints of the Requested Situation over general translation norms. E.g., if the situation is "Medical / Hospital", prioritize absolute precision and formal/objective terms even if the tone is "Casual". If the situation is "Emergency", translate rapidly with clear, concise, actionable phrasing.`,
        prompt: isSourceAutoDetect
          ? `Detect the language and translate to ${targetLanguage}: "${currentInput}"`
          : `Translate from ${sourceLanguage} to ${targetLanguage}: "${currentInput}"`,
        schema: isSourceAutoDetect
          ? z.object({
              detectedSourceLanguage: z.string().describe(`The detected language of the input message. Must be one of: English, Spanish, French, German, Japanese, Italian, Portuguese, Chinese (Mandarin), Korean, Russian, Arabic, Romanian, Thai.`),
              translation: z.string().describe(`The ${targetLanguage} translation.`)
            })
          : z.object({
              translation: z.string().describe(`The ${targetLanguage} translation.`)
            })
      });
      return Response.json(result.object);
    }

    // NORMAL (LOST IN TRANSLATION) CHECKS
    const systemPrompt = isSourceAutoDetect
      ? `You are a highly skilled cultural interpreter. Your goal is to prevent 'lost in translation' moments.
You are facilitating a conversation between two people. One speaks an unknown language and the other speaks ${targetLanguage}.

Here is the conversation history so far:
${historyText}

The active speaker just said: "${currentInput}"

Your task is to:
1. Detect the language of the active speaker's message.
2. Translate this new message into ${targetLanguage}, taking into account the context above.
${tone !== 'Auto' ? `IMPORTANT: The requested conversation tone is "${tone}". The translation MUST reflect this tone accurately.` : ''}
${situation !== 'General' ? `IMPORTANT: The requested situation/context is "${situation}". STRICTLY prioritize vocabulary and politeness suited for this situation (e.g. absolute precision for Medical, rapid concise translation for Emergency).` : ''}
3. Provide a 'sanity check': a roundtrip back-translation explaining exactly how the ${targetLanguage} speaker will perceive the translation, written in the detected source language.
4. If the message contains an idiom, slang, or concept that translates literally into something offensive or highly unnatural, provide a warning. Otherwise, warning should be null.
5. If the message contains an idiom or slang that doesn't translate literally, provide an idiom explanation and suggest the local equivalent in the target language. Otherwise, idiom_explanation should be null.
The detected language MUST be one of the following: English, Spanish, French, German, Japanese, Italian, Portuguese, Chinese (Mandarin), Korean, Russian, Arabic, Romanian, Thai.`
      : `You are a highly skilled cultural interpreter. Your goal is to prevent 'lost in translation' moments.
You are facilitating a conversation between two people. One speaks ${sourceLanguage} and the other speaks ${targetLanguage}.

Here is the conversation history so far:
${historyText}

The active speaker (${sourceLanguage} Speaker) just said: "${currentInput}"

Your task is to:
1. Translate this new message into ${targetLanguage}, taking into account the context above.
${tone !== 'Auto' ? `IMPORTANT: The requested conversation tone is "${tone}". The translation MUST reflect this tone accurately.` : ''}
${situation !== 'General' ? `IMPORTANT: The requested situation/context is "${situation}". STRICTLY prioritize vocabulary and politeness suited for this situation (e.g. absolute precision for Medical, rapid concise translation for Emergency).` : ''}
2. Provide a 'sanity check': a roundtrip back-translation explaining exactly how the ${targetLanguage} speaker will perceive the translation, written in ${sourceLanguage}.
3. If the message contains an idiom, slang, or concept that translates literally into something offensive or highly unnatural, provide a warning. Otherwise, warning should be null.
4. If the message contains an idiom or slang that doesn't translate literally, provide an idiom explanation and suggest the local equivalent in the target language. Otherwise, idiom_explanation should be null.`;

    const schema = isSourceAutoDetect
      ? z.object({
          detectedSourceLanguage: z.string().describe(`The detected language of the input message. Must be one of: English, Spanish, French, German, Japanese, Italian, Portuguese, Chinese (Mandarin), Korean, Russian, Arabic, Romanian, Thai.`),
          translation: z.string().describe(`The ${targetLanguage} translation of the last message.`),
          sanity_check: z.string().describe(`The back-translation (roundtrip) of the ${targetLanguage} text, explaining the true perceived intent in the detected source language.`),
          warning: z.string().nullable().describe('Warning about cultural misunderstanding or offensive literal translation. Null if safe.'),
          idiom_explanation: z.string().nullable().describe('If the message is an idiom or slang, explain why it makes no sense translated literally and suggest the local equivalent in the target language. Null otherwise.')
        })
      : z.object({
          translation: z.string().describe(`The ${targetLanguage} translation of the last message.`),
          sanity_check: z.string().describe(`The ${sourceLanguage} back-translation (roundtrip) of the ${targetLanguage} text, explaining the true perceived intent.`),
          warning: z.string().nullable().describe('Warning about cultural misunderstanding or offensive literal translation. Null if safe.'),
          idiom_explanation: z.string().nullable().describe('If the message is an idiom or slang, explain why it makes no sense translated literally and suggest the local equivalent in the target language. Null otherwise.')
        });

    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Please process the active speaker's message: "${currentInput}"`,
      schema,
    });

    return Response.json(result.object);
  } catch (error) {
    console.error('Translation error:', error);
    return Response.json({ error: 'Failed to translate' }, { status: 500 });
  }
}
