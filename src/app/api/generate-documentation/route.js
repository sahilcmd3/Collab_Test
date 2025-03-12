import { NextResponse } from "next/server";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export async function POST(request) {
    try {
        const { code, language } = await request.json();
        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const openaiClient = new OpenAIClient(process.env.NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT, new AzureKeyCredential(process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY));

        const prompt = `
        Generate documentation for the following code.
        Ensure that the documentation is in the form of inline comments to be added at the end of the file. 
        Don't write comments for each and every line of code.
        Use the appropriate comment style for the provided language.
        Don't include the language at the top, just the comments.
        Do not include the code or any markdowns, just the comments.
        Make it as detailed and descriptive as possible.
        Code:
        ${code}
        `;

        const result = await openaiClient.getCompletions({
            prompt: prompt,
            maxTokens: 150, // Adjust the max tokens as needed
        });

        let documentation = result.choices[0].text.trim();

        // Ensure the response doesn't contain the code or markdown
        documentation = documentation.replace(code, "").trim(); // Remove the code if it appears
        documentation = documentation.replace(language, "").trim();
        documentation = documentation.replace(/`{3}/g, "").replace(/`{3}$/g, "");

        return NextResponse.json({ documentation }, { status: 200 });
    } catch (error) {
        console.error("Azure OpenAI API Error:", error.response?.data || error.message);
        return NextResponse.json({ error: "Failed to generate documentation" }, { status: 500 });
    }
}