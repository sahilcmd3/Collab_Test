import { NextResponse } from "next/server";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export async function POST(request) {
    try {
        const { message } = await request.json();
        if (!message) {
            return NextResponse.json({ error: "Message is required" }, { status: 400 });
        }

        const openaiClient = new OpenAIClient(process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT, new AzureKeyCredential(process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY));

        const prompt = `You are an AI chatbot who helps people by providing code and solving their problems. Your response will be shown directly in the text, so respond like a chat. Here is the request: ${message}`;

        const result = await openaiClient.getCompletions({
            prompt: prompt,
            maxTokens: 150, // Adjust the max tokens as needed
        });

        let aiResponse = result.choices[0].text.trim();

        console.log(aiResponse);

        return NextResponse.json({ aiResponse }, { status: 200 });
    } catch (error) {
        console.error("Azure OpenAI API Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to generate response" }, { status: 500 });
    }
}