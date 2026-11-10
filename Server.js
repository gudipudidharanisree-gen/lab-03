
const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const app = express();
const PORT = 3000;

app.use(express.json());

let db;

// Database connection
async function connectDB() {
    db = await open({
        filename: "./database.db",
        driver: sqlite3.Database
    });

    console.log("Database connected successfully");
}

// GET all books with search, sorting, pagination and price filter
app.get("/books", async (req, res) => {
    try {
        const {
            search_q = "",
            order_by = "id",
            order = "ASC",
            limit = "10",
            offset = "0",
            min_price,
            max_price
        } = req.query;

        const allowedColumns = ["id", "title", "author", "price", "pages"];

        if (!allowedColumns.includes(order_by)) {
            return res.status(400).json({
                message: "Invalid sorting column"
            });
        }

        const sortOrder = order.toUpperCase();

        if (!["ASC", "DESC"].includes(sortOrder)) {
            return res.status(400).json({
                message: "Order must be ASC or DESC"
            });
        }

        const limitValue = Number(limit);
        const offsetValue = Number(offset);

        if (
            !Number.isInteger(limitValue) ||
            limitValue < 1 ||
            limitValue > 100 ||
            !Number.isInteger(offsetValue) ||
            offsetValue < 0
        ) {
            return res.status(400).json({
                message: "Invalid limit or offset"
            });
        }

        let sql = "SELECT * FROM book WHERE 1=1";
        const params = [];

        if (search_q.trim() !== "") {
            sql += " AND title LIKE ?";
            params.push(`%${search_q.trim()}%`);
        }

        if (min_price !== undefined) {
            const min = Number(min_price);

            if (min_price.trim() === "" || !Number.isFinite(min)) {
                return res.status(400).json({
                    message: "Invalid minimum price"
                });
            }

            sql += " AND price >= ?";
            params.push(min);
        }

        if (max_price !== undefined) {
            const max = Number(max_price);

            if (max_price.trim() === "" || !Number.isFinite(max)) {
                return res.status(400).json({
                    message: "Invalid maximum price"
                });
            }

            sql += " AND price <= ?";
            params.push(max);
        }

        if (
            min_price !== undefined &&
            max_price !== undefined &&
            Number(min_price) > Number(max_price)
        ) {
            return res.status(400).json({
                message: "Minimum price cannot exceed maximum price"
            });
        }

        sql += ` ORDER BY ${order_by} ${sortOrder} LIMIT ? OFFSET ?`;

        params.push(limitValue, offsetValue);

        const books = await db.all(sql, params);

        res.status(200).json({
            message: "Books fetched successfully",
            count: books.length,
            data: books
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch books",
            error: error.message
        });
    }
});

// GET single book
app.get("/books/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                message: "Invalid book ID"
            });
        }

        const book = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [id]
        );

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book fetched successfully",
            data: book
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch book",
            error: error.message
        });
    }
});

// POST new book
app.post("/books", async (req, res) => {
    try {
        const { title, author, price, pages } = req.body;

        if (
            typeof title !== "string" ||
            title.trim() === "" ||
            typeof author !== "string" ||
            author.trim() === "" ||
            price === undefined ||
            price === null ||
            price === "" ||
            !Number.isFinite(Number(price))
        ) {
            return res.status(400).json({
                message: "Title, author and valid numeric price are required"
            });
        }

        if (
            pages !== undefined &&
            (!Number.isInteger(Number(pages)) || Number(pages) < 1)
        ) {
            return res.status(400).json({
                message: "Pages must be a positive integer"
            });
        }

        const result = await db.run(
            `INSERT INTO book (title, author, price, pages)
             VALUES (?, ?, ?, ?)`,
            [
                title.trim(),
                author.trim(),
                Number(price),
                pages === undefined ? null : Number(pages)
            ]
        );

        const newBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [result.lastID]
        );

        res.status(201).json({
            message: "Book added successfully",
            data: newBook
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to add book",
            error: error.message
        });
    }
});

// PUT update book
app.put("/books/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { title, author, price, pages } = req.body;

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                message: "Invalid book ID"
            });
        }

        const existingBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [id]
        );

        if (!existingBook) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        if (
            title === undefined &&
            author === undefined &&
            price === undefined &&
            pages === undefined
        ) {
            return res.status(400).json({
                message: "Provide at least one field to update"
            });
        }

        if (
            title !== undefined &&
            (typeof title !== "string" || title.trim() === "")
        ) {
            return res.status(400).json({
                message: "Invalid title"
            });
        }

        if (
            author !== undefined &&
            (typeof author !== "string" || author.trim() === "")
        ) {
            return res.status(400).json({
                message: "Invalid author"
            });
        }

        if (
            price !== undefined &&
            (price === "" || price === null || !Number.isFinite(Number(price)))
        ) {
            return res.status(400).json({
                message: "Invalid price"
            });
        }

        if (
            pages !== undefined &&
            (!Number.isInteger(Number(pages)) || Number(pages) < 1)
        ) {
            return res.status(400).json({
                message: "Invalid pages"
            });
        }

        await db.run(
            `UPDATE book
             SET title = ?, author = ?, price = ?, pages = ?
             WHERE id = ?`,
            [
                title === undefined ? existingBook.title : title.trim(),
                author === undefined ? existingBook.author : author.trim(),
                price === undefined ? existingBook.price : Number(price),
                pages === undefined ? existingBook.pages : Number(pages),
                id
            ]
        );

        const updatedBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [id]
        );

        res.status(200).json({
            message: "Book updated successfully",
            data: updatedBook
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to update book",
            error: error.message
        });
    }
});

// DELETE book
app.delete("/books/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id < 1) {
            return res.status(400).json({
                message: "Invalid book ID"
            });
        }

        const existingBook = await db.get(
            "SELECT * FROM book WHERE id = ?",
            [id]
        );

        if (!existingBook) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        await db.run(
            "DELETE FROM book WHERE id = ?",
            [id]
        );

        res.status(200).json({
            message: "Book deleted successfully",
            data: existingBook
        });

    } catch (error) {
        res.status(500).json({
            message: "Failed to delete book",
            error: error.message
        });
    }
});

// Start server
async function startServer() {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });

    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
}

startServer();
