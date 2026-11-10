
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");

const app = express();
const PORT = 3000;

app.use(express.json());

let db;

// Connect to SQLite database
async function connectDB() {
    try {
        db = await open({
            filename: "./database.db",
            driver: sqlite3.Database
        });

        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
}

// GET all books with search, sorting, pagination and price filters
app.get("/books", async (req, res) => {
    try {
        const {
            search_q,
            order_by = "id",
            order = "ASC",
            limit = 10,
            offset = 0,
            min_price,
            max_price
        } = req.query;

        const allowedColumns = ["id", "title", "author", "price", "pages"];
        const sortColumn = allowedColumns.includes(order_by)
            ? order_by
            : "id";

        const sortOrder = order.toUpperCase() === "DESC" ? "DESC" : "ASC";

        const conditions = [];
        const values = [];

        if (search_q) {
            conditions.push("title LIKE ?");
            values.push(`%${search_q}%`);
        }

        if (min_price !== undefined) {
            conditions.push("price >= ?");
            values.push(Number(min_price));
        }

        if (max_price !== undefined) {
            conditions.push("price <= ?");
            values.push(Number(max_price));
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const safeLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
        const safeOffset = Math.max(0, parseInt(offset) || 0);

        const sql = `
            SELECT * FROM book
            ${whereClause}
            ORDER BY ${sortColumn} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        values.push(safeLimit, safeOffset);

        const books = await db.all(sql, values);

        res.status(200).json({
            message: "Books fetched successfully",
            count: books.length,
            books
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching books",
            error: error.message
        });
    }
});

// GET a single book by ID
app.get("/books/:id", async (req, res) => {
    try {
        const book = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [req.params.id]
        );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book fetched successfully",
            book
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching book",
            error: error.message
        });
    }
});

// POST - Add a new book
app.post("/books", async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        if (
            !title ||
            !author ||
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price))
        ) {
            return res.status(400).json({
                message: "Title, author and a valid numeric price are required"
            });
        }

        const result = await db.run(
            `INSERT INTO book (title, author, price, pages)
             VALUES (?, ?, ?, ?)`,
            [title, author, Number(price), pages ?? null]
        );

        res.status(201).json({
            message: "Book added successfully",
            bookId: result.lastID
        });
    } catch (error) {
        res.status(500).json({
            message: "Error adding book",
            error: error.message
        });
    }
});

// PUT - Update a book
app.put("/books/:id", async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        const existingBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [req.params.id]
        );

        if (!existingBook) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        if (
            !title ||
            !author ||
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price))
        ) {
            return res.status(400).json({
                message: "Title, author and a valid numeric price are required"
            });
        }

        await db.run(
            `UPDATE book
             SET title = ?, author = ?, price = ?, pages = ?
             WHERE id = ?`,
            [title, author, Number(price), pages ?? null, req.params.id]
        );

        res.status(200).json({
            message: "Book updated successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error updating book",
            error: error.message
        });
    }
});

// DELETE - Delete a book
app.delete("/books/:id", async (req, res) => {
    try {
        const existingBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [req.params.id]
        );

        if (!existingBook) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        await db.run(
            "DELETE FROM book WHERE id = ?",
            [req.params.id]
        );

        res.status(200).json({
            message: "Book deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting book",
            error: error.message
        });
    }
});

// Start server after database connection
connectDB().then(() => {
    if (db) {
        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    }
});
