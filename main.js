import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocketServer } from 'ws'; 

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data.json");
const HTML_FILE = path.join(__dirname, "./pages/main.html");

app.use(express.static(__dirname));
app.use(express.json());

// Главная страница с товарами
app.get("/", (req, res) => {
    fs.readFile(DATA_FILE, "utf8", (err, data) => {
        if (err) {
            console.error("Ошибка чтения файла:", err);
            return res.status(500).send("Ошибка сервера");
        }

        let products = [];
        try {
            products = JSON.parse(data);
        } catch (parseError) {
            console.error("Ошибка парсинга JSON:", parseError);
            return res.status(500).send("Ошибка данных");
        }

        // Получаем уникальные категории
        const categories = [...new Set(products.map((product) => product.category))];

        // Читаем HTML-шаблон
        fs.readFile(HTML_FILE, "utf8", (err, htmlContent) => {
            if (err) {
                console.error("Ошибка чтения HTML-файла:", err);
                return res.status(500).send("Ошибка сервера");
            }

            // Генерируем список категорий
            const categoryOptions = categories.map((category) => `
                <option value="${category}">${category}</option>
            `).join('');

            // Генерируем HTML с товарами
            const productCards = products.map((product) => `
                <div class="product" data-category="${product.category}">
                    <h3>${product.name}</h3>
                    <p>Описание: ${product.description}</p>
                    <p>Цена: ${product.price} руб.</p>
                </div>
            `).join("");

            // Вставляем товары и категории в HTML
            let finalHtml = htmlContent
                .replace("{{{categories}}}", categoryOptions || "<option value='all'>Нет категорий</option>")
                .replace("{{{products}}}", productCards || "<p>Нет товаров.</p>");

            res.send(finalHtml);
        });
    });
});

// Создаем WebSocket сервер
const wss = new WebSocketServer({ port: 8081 });

wss.on('connection', (ws) => {
    console.log('Новое подключение к WebSocket');

    // Обработка входящих сообщений
    ws.on('message', (message) => {
        console.log('Получено сообщение:', message.toString());

        // Рассылаем сообщение всем подключенным клиентам
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) { // Проверяем, что соединение открыто
                client.send(message.toString());
            }
        });
    });

    // Обработка закрытия соединения
    ws.on('close', () => {
        console.log('Клиент отключился');
    });
});

console.log('WebSocket сервер запущен на ws://localhost:8081');

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});