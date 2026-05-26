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
    const { imageBase64, sourceLanguage, targetLanguage } = await req.json();

    if (!imageBase64 || !sourceLanguage || !targetLanguage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const systemPrompt = `You are an expert translator and cultural guide. You will be provided with an image containing text in ${sourceLanguage}. 
Your goal is to:
1. Read the text in the image.
2. Translate it into ${targetLanguage}.
3. If the image is of a menu, a sign, or a cultural item, provide a brief explanation of what it actually is in ${targetLanguage}. For example, if it's "Takoyaki", explain that it's "Fried octopus balls".
Keep the explanation concise and helpful.`;

    // Remove the data URI prefix (e.g., data:image/jpeg;base64,) if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const { object } = await generateObject({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      schema: z.object({
        originalText: z.string().describe(`A summary or transcription of the text found in the image in ${sourceLanguage}. Keep it short.`),
        translation: z.string().describe(`The translation and brief explanation in ${targetLanguage}.`),
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
