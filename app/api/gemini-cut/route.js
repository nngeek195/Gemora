import { NextResponse } from 'next/server';

// The private environment variable is automatically available here
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request) {
    if (!GEMINI_API_KEY) {
        return NextResponse.json(
            { error: 'Server configuration error: GEMINI_API_KEY not set.' },
            { status: 500 }
        );
    }

    // Define the System Instruction for the VLM (Gemologist role)
    const systemPrompt = `You are a world-class gemologist and master diamond cutter. Analyze the provided image of a rough gemstone. Based on the stone's visible properties (shape, size, color, and internal structure/clarity hints), recommend the *single best* gemstone cut that would maximize its brilliance, fire, and overall value. The user wants the 'most beautiful cut'.

  Your response must be concise and only contain the recommended name of the cut, such as 'Round Brilliant Cut', 'Emerald Cut', 'Cushion Cut', 'Cabochon', or 'Princess Cut'. Do not add any extra text, explanation, or conversational filler.`;

    try {
        const { base64Image, mimeType } = await request.json();

        const model = 'gemini-2.5-flash';
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        // CORRECT PAYLOAD STRUCTURE for systemInstruction
        const payload = {
            contents: [{
                role: "user",
                parts: [
                    { text: "What is the single best cut for this stone? Only provide the name of the cut." },
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Image
                        }
                    }
                ]
            }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorDetail = await response.json();
            console.error("Gemini API Error:", errorDetail);
            return NextResponse.json(
                { error: 'Failed to get prediction from Gemini API.' },
                { status: response.status }
            );
        }

        const result = await response.json();
        const cutPrediction = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Unknown Cut';

        return NextResponse.json({ cut: cutPrediction });

    } catch (error) {
        console.error('API Route execution error:', error);
        return NextResponse.json(
            { error: 'An unexpected server error occurred.' },
            { status: 500 }
        );
    }
}