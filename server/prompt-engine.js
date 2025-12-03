export function buildPrompt({ modelName, shot, pose, emotion, description, clothFileName }) {
return `
Model: ${modelName}
Shot: ${shot}
Pose: ${pose}
Emotion: ${emotion}

Clothing Reference:
${clothFileName ? `/uploads/${clothFileName}` : "Not provided"}

Extra Description:
${description}

Generate a high-quality, realistic AI fashion photo with professional lighting, clean background, sharp details.
`.trim();
}