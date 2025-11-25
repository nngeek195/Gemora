import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// POST /api/gemini-assistant
export async function POST(req: Request) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: 'Missing GEMINI_API_KEY in environment variables.' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { messages, predefinedContext } = body as {
            messages: { role: 'user' | 'assistant'; text: string }[];
            predefinedContext?: string;
        };

        const systemText =
            predefinedContext ||
            'You are a helpful assistant for a gem app called Gemora.';

        // Gemini expects "contents" with roles: "user" and "model"
        const contents = [
            {
                role: 'user',
                parts: [{ text: systemText }],
            },
            ...messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.text }],
            })),
        ];

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents }),
            }
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            console.error('Gemini API error:', errText);
            return NextResponse.json(
                { error: 'Gemini API error', details: errText },
                { status: 500 }
            );
        }

        const data = await geminiRes.json();

        const reply =
            data?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text || '')
                .join('') || 'Sorry, I could not generate a response.';

        return NextResponse.json({ reply });
    } catch (e: any) {
        console.error('Gemini route exception:', e);
        return NextResponse.json(
            { error: 'Server error', details: e?.message || String(e) },
            { status: 500 }
        );
    }
}
