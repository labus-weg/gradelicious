import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { prompt, model } = await req.json();
    const startTime = Date.now();
    let response;

    if (model.includes('gpt')) {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
      });
      response = completion.choices[0].message.content;
    } else {
      const completion = await anthropic.messages.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
      });
      response = completion.content[0].text;
    }

    const responseTime = Date.now() - startTime;

    const result = await prisma.evaluation.create({
      data: {
        prompt,
        modelName: model,
        response: response || '',
        responseTime,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Evaluation error:', error);
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
