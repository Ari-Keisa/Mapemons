import { GoogleGenAI } from "@google/genai";
import fs from "fs";

// === ИНСТРУКЦИЯ ПО ИСПОЛЬЗОВАНИЮ ===
// 1. Убедись, что установлен пакет: npm install @google/genai
// 2. Установи свой ключ API в переменную окружения GEMINI_API_KEY
//    В терминале: set GEMINI_API_KEY=твой_ключ
// 3. Запусти скрипт: node generate_video.js

// Инициализация API
const ai = new GoogleGenAI({}); // Ключ подхватится из GEMINI_API_KEY автоматически

// Офигенный кинематографичный промпт для Veo 3.1 по твоему ТЗ
const prompt = `A chaotic and funny group photo attempt in a high-tech developer room. There are 4 people wearing stylish modern developer clothes in vibrant green tones.
1. A girl with very long blonde hair reaching down to her lower back, laughing.
2. A cute blonde girl, trying to wrangle a small magical elemental creature.
3. A man with dark hair, distracted and intensely trying to fix a bug on a glowing holographic screen.
4. A tall man with brown hair, looking very frustrated at the camera.

Several small, cute, colorful fantasy elemental creatures (floating energy blobs and little elemental spirits, definitely NOT cats and NOT dogs) are ruining the shot. One creature just knocked over the camera tripod. Another creature is flying right in front of the tall guy's face. The lighting is cinematic, vibrant, colorful, and playful. High quality anime/3D blend aesthetic.`;

async function generateOurVideo() {
    console.log("🎬 Начинаем генерацию видео: 'Групповое фото: Ожидание vs Реальность'...");

    try {
        let operation = await ai.models.generateVideos({
            model: "veo-3.1-generate-preview",
            prompt: prompt,
            config: {
                resolution: "1080p", // или 4k если нужно
                // Используем референсы всех четырех персонажей!
                referenceImages: [
                  { image: { imageBytes: fs.readFileSync("images/Ари.png").toString("base64"), mimeType: "image/png" }, referenceType: "asset" },
                  { image: { imageBytes: fs.readFileSync("images/Хас.png").toString("base64"), mimeType: "image/png" }, referenceType: "asset" },
                  { image: { imageBytes: fs.readFileSync("images/Ланс.png").toString("base64"), mimeType: "image/png" }, referenceType: "asset" },
                  { image: { imageBytes: fs.readFileSync("images/Лина.png").toString("base64"), mimeType: "image/png" }, referenceType: "asset" }
                ]
            },
        });

        // Ожидание готовности видео
        while (!operation.done) {
            console.log("⏳ Видео генерируется... Ждем (Veo 3.1 обычно нужно немного времени)...");
            await new Promise((resolve) => setTimeout(resolve, 15000)); // Ждем 15 секунд между запросами
            operation = await ai.operations.getVideosOperation({
                operation: operation,
            });
        }

        // Скачивание
        console.log("✅ Видео готово! Скачиваем...");
        await ai.files.download({
            file: operation.response.generatedVideos[0].video,
            downloadPath: "./images/group_photo_video.mp4",
        });

        console.log(`🎉 УРА! Видео успешно сохранено в папку images/group_photo_video.mp4`);
        console.log(`Не забудь поменять в index.html тег <img> на <video autoplay loop muted src="images/group_photo_video.mp4"></video>!`);

    } catch (error) {
        console.error("❌ Ой, произошла ошибка:", error);
    }
}

generateOurVideo();
