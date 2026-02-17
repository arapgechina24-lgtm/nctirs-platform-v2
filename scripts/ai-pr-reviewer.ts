import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize clients
const anthropic = process.env.ANTHROPIC_API_KEY
    ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    : null;

const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

const SYSTEM_PROMPT = `
You are an expert Senior Security Engineer and Code Reviewer acting as a gatekeeper for a high-security intelligence platform.
Your task is to review code diffs and provide critical, actionable feedback.

Focus on:
1. **Security Vulnerabilities**: OWASP Top 10, injection flaws, auth bypasses, sensitive data exposure.
2. **Performance Issues**: O(n^2) loops, memory leaks, inefficient queries.
3. **Code Quality**: DRI (Don't Repeat Yourself), extensive complexity, type safety (TypeScript).
4. **Best Practices**: Modern React/Next.js patterns, proper error handling.

**Output Format:**
- If the code looks good, strictly reply with "LGTM".
- If there are issues, provide a bulleted list of specific findings.
- Use Markdown for code snippets.
- Be concise and professional.
`;

export async function reviewCode(fileName: string, diff: string): Promise<string | null> {
    if (!diff || diff.length < 10) return null;

    // Prioritize Claude
    if (anthropic) {
        try {
            const message = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 1024,
                system: SYSTEM_PROMPT,
                messages: [
                    {
                        role: 'user',
                        content: `Review the following change in "${fileName}":\n\n\`\`\`diff\n${diff}\n\`\`\``
                    }
                ]
            });

            // Handle specific content block types properly
            const textContent = message.content.find(c => c.type === 'text');
            return textContent && textContent.type === 'text' ? textContent.text : null;
        } catch (error) {
            console.error('Claude review failed:', error);
            // Fallback to Gemini
        }
    }

    // Fallback to Gemini
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
            const result = await model.generateContent([
                SYSTEM_PROMPT,
                `Review the following change in "${fileName}":\n\n\`\`\`diff\n${diff}\n\`\`\``
            ]);
            return result.response.text();
        } catch (error) {
            console.error('Gemini review failed:', error);
        }
    }

    return null;
}
