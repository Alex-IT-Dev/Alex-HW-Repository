// Программа запрашивает наименование продуктов в вашем холодильнике
// и их количество. После ввода всех продуктов, программа выводит список и
// продуктов с их количеством и сохраняет данные в видее JSON в
// файл в корне проекта.
// readline.createInterface() используется для создания интерфейса
// чтения данных из стандартного ввода (stdin) и записи данных в
// стандартный вывод (stdout).

// JSON.stringify(fridge, null, 2 ) используется для преобразования
// объекта JavaScript в строку JSON,
// где null означает, что не используется функция замены replacer,
// а 2 указывает на количество пробелов для отступа в формате JSON.

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";

async function runFridgeApp() {
  const rl = readline.createInterface({ input, output });
  const filePath = path.resolve("fridge.csv");
  let fridge = [];

  // Пробуем загрузить уже сохранённый список из CSV, если файл существует
  try {
    const existingData = await readFile(filePath, "utf-8");
    fridge = fromCsv(existingData);
    if (fridge.length > 0) {
      console.log(`Загружено позиций из файла: ${fridge.length}`);
      console.log("Текущее содержимое холодильника:");
      fridge.forEach((product) => {
        console.log(`- ${product.name}: ${product.count}`);
      });
    } else {
      console.log("Холодильник пока пуст.");
    }
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Ошибка при чтении существующего CSV:", error.message);
    }
  }

  console.log("Программа для учета продуктов в холодильнике.");
  console.log("Введите продукты в холодильнике. Для выхода введите 'exit', 'выход', 'stop' или 'стоп'.");

  while (true) {
    const name = await rl.question("Введите наименование продукта: ");
    const trimmedName = name.trim();
    const normalizedName = trimmedName.toLowerCase();
    const stopCommands = new Set(["exit", "выход", "stop", "стоп"]);

    if (stopCommands.has(normalizedName)) {
      break;
    }

    if (trimmedName === "") {
      // Проверка на пустую строку
      // if (!trimmedName)
      console.log(
        "Наименование продукта не может быть пустым. Попробуйте снова.",
      );
      continue;
    }

    const countInput = await rl.question(
      `Введите количество продукта "${trimmedName}" (0 для удаления, exit, выход, stop или стоп для выхода): `,
    );
    const normalizedCountInput = countInput.trim().toLowerCase();
    if (stopCommands.has(normalizedCountInput)) {
      break;
    }

    const rawCount = Number(countInput.trim().replace(",", "."));
    const count = Number.isNaN(rawCount) ? 0 : rawCount;

    const existingIndex = fridge.findIndex(
      (item) => item.name.toLowerCase() === normalizedName,
    );

    if (count === 0) {
      if (existingIndex !== -1) {
        const [removed] = fridge.splice(existingIndex, 1);
        console.log(`Продукт "${removed.name}" удалён из списка.`);
      } else {
        console.log(
          `Продукт "${trimmedName}" не найден в списке — удалять нечего.`,
        );
      }
      continue;
    }

    if (existingIndex !== -1) {
      fridge[existingIndex].count = count;
      console.log("Количество продукта обновлено:", fridge[existingIndex]);
    } else {
      const newItem = { name: trimmedName, count };
      fridge.push(newItem);
      console.log("Продукт добавлен:", newItem);
    }
  }

  rl.close(); // Закрываем интерфейс readline после завершения ввода данных

  try {
    // 1. Сохраняем (или обновляем) CSV-файл
    const csvContent = toCsv(fridge);
    await writeFile(filePath, csvContent, "utf-8");
    console.log(`CSV-файл обновлён: ${filePath}`);

    // 2. Читаем обновлённый файл и преобразуем обратно в массив объектов
    const fileData = await readFile(filePath, "utf-8");
    console.log("Содержимое CSV:\n" + fileData);

    const saveProducts = fromCsv(fileData);

    // 3. Выводим обновлённый список
    console.log("1. Обновлённый список продуктов в холодильнике:");
    if (saveProducts.length === 0) {
      console.log("(список пуст)");
    } else {
      saveProducts.forEach((product) => {
        console.log(`- ${product.name}: ${product.count}`);
      });
    }

    console.log("2. Таблица продуктов:");
    console.table(saveProducts);
  } catch (error) {
    console.error("Ошибка при работе с файлом:", error.message);
  }
}

function escapeCsvField(value) {
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

function toCsv(items) {
  const header = "name,count";
  const rows = items.map(
    (item) => `${escapeCsvField(item.name)},${escapeCsvField(item.count)}`,
  );
  return [header, ...rows].join("\n");
}

function parseCsvLine(line) {
  const fields = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

function fromCsv(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) return [];

  return lines.slice(1).map((line) => {
    const [name = "", countRaw = "0"] = parseCsvLine(line);
    const parsedCount = Number(countRaw);
    return {
      name,
      count: Number.isNaN(parsedCount) ? 0 : parsedCount,
    };
  });
}
runFridgeApp();

/*
--------------------------------------------------------------------------------------------------------------------
1.ADV. САМОСТОЯТЕЛЬНО ИЗУЧИТЬ
Переделайте программу так, чтобы она сохраняла данные в CSV файл (такая возможность есть в Excel)
 в корне проекта вместо JSON файла.

ПРИМЕР CSV ФАЙЛА:

Наименование,Количество
qqq,2
aaa,44.2
zzzz,55


2. Преработайте программу с урока или из п.1 так, чтобы ввод прекращался на слова "exit", "выход", "stop" или 
"стоп" (без учета регистра) и сохранялись данные в CSV (JSON) файл в корне проекта. 


3. Доработайте программу с урока или из п.1 так, чтобы она позволяла пользователю удалять 
продукты из списка по наименованию если мы ввели 0 количество для данного наименования. 
После удаления продукта, программа должна обновлять CSV (JSON) файл 
и выводить обновленный список продуктов.


4. Доработайте программу с урока или из п.1 так, чтобы она позволяла пользователю изменять 
количество продукта в списке по наименованию если мы ввели другое количество для 
данного наименования но отличное от 0б. После изменения количества продукта, программа 
должна обновлять CSV (JSON) файл и выводить обновленный список продуктов.
--------------------------------------------------------------------------------------------------------------------
*/
