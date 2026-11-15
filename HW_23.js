/*
HW_23_TEXT
1.Из полученного ответа извлеките 
и распечатайте данные про коды ответа и их расшифровку.
2*** Подсчитайте, сколько раз в ответе упоминаются методы REST (GET, POST и т.д.).
и распечатайте результат. Используйте методы строк и массивов.
*/

import { GoogleGenAI } from "@google/genai";

async function askAi(prompt) {
  const genAi = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  const response = await genAi.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  return response.text;
}

async function main() {
  const prompt =
    "Напиши что такое REST API и как его использовать в JavaScript";

  const aiResponse = await askAi(prompt);

  console.log("AI Response:", aiResponse);

  const statusCodes = [
    "200", "201", "204", "301", "400", "401", "403", "404", "500", "502", "503",
  ];
  const codeBlocksFilter = ["const ", "let ", "fetch(", "http", "//"];

  const statusLines = aiResponse
    .split("\n")
    .map((line) => line.trim())
    .filter(
      (line) =>
        statusCodes.some((code) => line.includes(code)) &&
        !codeBlocksFilter.some((codePart) => line.includes(codePart)),
    );

  console.log("\n=== 1. Коды ответа и их расшифровка ===");
  if (statusLines.length > 0) {
    console.log(statusLines.join("\n"));
  } else {
    console.log(
      "В этой генерации ИИ не расписал коды ответа (уточните промпт или перезапустите скрипт).",
    );
  }

  const restMethods = [
    "GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS",
  ];
  const separators = [
    ".", ",", ":", ";", "!", "?", "(", ")", "[", "]", "{", "}", "'", '"', "`", "*", "-", "/", "\n", "\r",
  ];

  const cleanedText = separators.reduce(
    (text, symbol) => text.replaceAll(symbol, " "),
    aiResponse.toUpperCase(),
  );

  const words = cleanedText.split(" ").filter((word) => word !== "");

  const methodCounts = restMethods.reduce((acc, method) => {
    const count = words.filter((word) => word === method).length;
    if (count > 0) {
      acc[method] = count;
    }
    return acc;
  }, {});

  const totalMentions = Object.values(methodCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  console.log("\n=== 2. Статистика упоминаний методов REST ===");
  Object.entries(methodCounts).forEach(([method, count]) => {
    console.log(`${method}: ${count} раз(а)`);
  });
  console.log(`Всего упоминаний методов: ${totalMentions}`);
}

main();

