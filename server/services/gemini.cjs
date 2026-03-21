/**
 * Server-side Gemini AI service for YourGbedu.
 *
 * Generates a concise, actionable production brief for the music team
 * from a customer's order data. The brief is stored in the DB and shown
 * in the admin panel so producers can start work immediately.
 */
const { GoogleGenAI } = require('@google/genai');

const genai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

/**
 * Generate an AI-powered production brief for an order.
 *
 * @param {object} orderData
 * @param {string} orderData.recipientType   - e.g. "Wife"
 * @param {string} orderData.senderName      - e.g. "Tunde"
 * @param {string} orderData.genre           - e.g. "Afro-R&B"
 * @param {string} orderData.voiceGender     - e.g. "Female Voice"
 * @param {string} orderData.specialQualities - Free-form text
 * @param {string} orderData.favoriteMemories - Free-form text
 * @param {string} orderData.specialMessage   - Free-form text
 * @returns {Promise<string>} The production brief text, or a fallback summary.
 */
async function generateProductionBrief(orderData) {
    if (!genai) {
        console.log('[Gemini] GEMINI_API_KEY not set — skipping AI brief generation');
        return buildFallbackBrief(orderData);
    }

    const { recipientType, senderName, genre, voiceGender, specialQualities, favoriteMemories, specialMessage } = orderData;

    const prompt = `You are a music producer's assistant at a custom song studio. A client has submitted the following brief for a personalized song. Write a clear, concise production brief (150–200 words) that:
1. Summarizes the emotional core of the story in 1–2 sentences
2. Lists 3–5 specific lyrical themes or moments to include (draw from memories and special qualities)
3. Notes the recommended musical direction based on the genre
4. Includes the key message from the client's heart to weave into lyrics

Client Brief:
- Song For: ${recipientType}
- From: ${senderName}
- Genre: ${genre}
- Voice: ${voiceGender}
- What makes them special: ${specialQualities}
- Favorite memories: ${favoriteMemories}
- Message from the heart: ${specialMessage}

Production Brief:`;

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const brief = response.text?.trim();
        if (!brief) throw new Error('Empty response from Gemini');

        console.log('[Gemini] Production brief generated successfully');
        return brief;
    } catch (err) {
        console.error('[Gemini] Failed to generate brief:', err.message);
        return buildFallbackBrief(orderData);
    }
}

/**
 * Fallback brief used when Gemini is unavailable.
 */
function buildFallbackBrief({ recipientType, senderName, genre, voiceGender, specialQualities, favoriteMemories, specialMessage }) {
    return [
        `Custom ${genre} song from ${senderName || 'the client'} for their ${recipientType || 'loved one'}.`,
        voiceGender ? `Voice preference: ${voiceGender}.` : '',
        specialQualities ? `What makes them special: ${specialQualities}` : '',
        favoriteMemories ? `Memories to draw from: ${favoriteMemories}` : '',
        specialMessage ? `Core message: ${specialMessage}` : '',
    ].filter(Boolean).join('\n\n');
}

module.exports = { generateProductionBrief };
