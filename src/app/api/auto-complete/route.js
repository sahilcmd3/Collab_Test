import { NextResponse } from "next/server";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export async function POST(request) {
    try {
        const { code, language } = await request.json();
        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const openaiClient = new OpenAIClient(process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT, new AzureKeyCredential(process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY));

        const prompt = `generate clear and concise documentation in the form of comments to be added at the end of the 
        code file for the code: ${code}. use the appropriate comment format for the language of the code.`;

        const result = await openaiClient.getCompletions({
            prompt: prompt,
            maxTokens: 150, // Adjust the max tokens as needed
        });

        let documentation = result.choices[0].text.trim();
        documentation = documentation.replace(/```[\s\S]*?```/g, ""); // Remove triple backticks if any
        documentation = documentation.replace(code, "").trim(); // Remove the code if it appears
        console.log(documentation);

        return NextResponse.json({ documentation }, { status: 200 });
    } catch (error) {
        console.error("Azure OpenAI API Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to generate documentation" }, { status: 500 });
    }
}