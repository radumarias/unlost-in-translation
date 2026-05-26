import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

export const maxDuration = 60;

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { imageBase64, userLanguage, otherLanguage, isAutoDetect } = await req.json();

    if (!imageBase64 || !userLanguage || !otherLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = isAutoDetect 
      ? `You are a helpful translation assistant.
You must analyze the image, detect the language of any prominent text, and transcribe it.
Translate the text to ${userLanguage}. The detected language can be any language.

CRITICAL: You must provide a brief explanation if the image is a specific food, sign, or cultural item. The translation AND this explanation MUST be written entirely in ${userLanguage}.
The detected language MUST be one of the following: English, Spanish, French, German, Japanese, Italian, Portuguese, Chinese (Mandarin), Korean, Russian, Arabic, Romanian, Thai.`
      : `You are a helpful translation assistant in a conversation between a ${userLanguage} speaker and a ${otherLanguage} speaker.
You must analyze the image, detect the language of any prominent text, and transcribe it.
- If the text in the image is in ${userLanguage}, translate it to ${otherLanguage}.
- If the text is in ${otherLanguage} or any other language, translate it to ${userLanguage}.

CRITICAL: You must provide a brief explanation if the image is a specific food, sign, or cultural item. The translation AND this explanation MUST be written entirely in the target language you are translating to.
The detected language MUST be one of the following: English, Spanish, French, German, Japanese, Italian, Portuguese, Chinese (Mandarin), Korean, Russian, Arabic, Romanian, Thai.`;

    // Remove the data URI prefix (e.g., data:image/jpeg;base64,) if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      schema: z.object({
        detectedLanguage: z.string().describe(`The detected language of the text. Must be one of the supported languages.`),
        originalText: z.string().describe(`A summary or transcription of the text found in the image in its original language. Keep it short.`),
        translation: z.string().describe(`The translation and brief explanation in the appropriate target language based on your instructions.`),
      }),
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Please translate and explain this image.' },
            {
              type: 'image',
              image: Buffer.from(base64Data, 'base64'),
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (error) {
    console.error('Vision API Error:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
