import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";// Импортируем WebSocket

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8080;
const DATA_FILE = path.join(__dirname, "data.json");
const createPath = (page) => path.resolve(__dirname, "pages", `${page}.html`);

app.use(express.json());

// Создаем HTTP сервер
const server = app.listen(PORT, () => {
    console.log(`Админ-сервер запущен на http://localhost:${PORT}`);
});


// Маршрут для страницы админ-панели
app.get("/admin", (req, res) => {
    res.sendFile(createPath("main-admin"));
});

// Функция чтения данных из файла
const readData = () => {
    try {
        const data = fs.readFileSync(DATA_FILE, "utf8");
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
};

// Функция записи данных в файл
const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// Добавление нового товара
app.post("/admin", (req, res) => {
    const { name, price, description, category } = req.body;
    
    if (!name || !price || !description || !category) {
        return res.status(400).send({ message: "Все поля обязательны!" });
    }

    const products = readData();
    const newProduct = { id: products.length, name, price, description, category };
    products.push(newProduct);
    writeData(products);

    res.send({ message: "Товар добавлен успешно", product: newProduct });
});

// Обновление товара по ID
app.put("/admin/:id", (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    let products = readData();
    
    const index = products.findIndex(p => p.id == id);
    if (index === -1) return res.status(404).send({ message: "Товар не найден" });

    products[index] = { ...products[index], ...updatedData };
    writeData(products);

    res.send({ message: "Товар обновлен успешно", product: products[index] });
});

// Удаление товара по ID
app.delete("/admin/:id", (req, res) => {
    const { id } = req.params;
    let products = readData();
    
    const index = products.findIndex(p => p.id == id);
    if (index === -1) return res.status(404).send({ message: "Товар не найден" });

    products.splice(index, 1);
    
    // Переназначаем ID по порядку
    products = products.map((product, index) => ({ ...product, id: index }));
    writeData(products);

    res.send({ message: "Товар удален успешно" });
});