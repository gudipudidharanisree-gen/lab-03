
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
app.use(express.json());

const db = new sqlite3.Database("./database.db");

const PORT = 3000;

// Helper functions for database operations
const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

// Initialize server
const initializeDBAndServer = async () => {
  try {
    await dbGet("SELECT name FROM sqlite_master WHERE type='table' AND name='book'");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.log(`Database error: ${error.message}`);
  }
};

// GET /books - Search, sort, filter and pagination
app.get("/books", async (request, response) => {
  try {
    const {
      search_q = "",
      order_by = "id",
      order = "ASC",
      limit = "10",
      offset = "0",
      min_price,
      max_price,
    } = request.query;

    const allowedColumns = ["id", "title", "author", "price", "pages"];

    if (!allowedColumns.includes(order_by)) {
      return response.status(400).json({
        message: "Invalid order_by column",
      });
    }

    const sortOrder = order.toUpperCase();

    if (!["ASC", "DESC"].includes(sortOrder)) {
      return response.status(400).json({
        message: "Order must be ASC or DESC",
      });
    }

    const pageLimit = Number(limit);
    const pageOffset = Number(offset);

    if (
      !Number.isInteger(pageLimit) ||
      pageLimit <= 0 ||
      !Number.isInteger(pageOffset) ||
      pageOffset < 0
    ) {
      return response.status(400).json({
        message: "Limit must be positive and offset must be non-negative",
      });
    }

    if (
      (min_price !== undefined && (!Number.isFinite(Number(min_price)) || Number(min_price) < 0)) ||
      (max_price !== undefined && (!Number.isFinite(Number(max_price)) || Number(max_price) < 0))
    ) {
      return response.status(400).json({
        message: "Price values must be valid non-negative numbers",
      });
    }

    if (
      min_price !== undefined &&
      max_price !== undefined &&
      Number(min_price) > Number(max_price)
    ) {
      return response.status(400).json({
        message: "min_price cannot be greater than max_price",
      });
    }

    let sql = "SELECT * FROM book WHERE title LIKE ?";
    const params = [`%${search_q}%`];

    if (min_price !== undefined && max_price !== undefined) {
      sql += " AND price BETWEEN ? AND ?";
      params.push(Number(min_price), Number(max_price));
    } else if (min_price !== undefined) {
      sql += " AND price >= ?";
      params.push(Number(min_price));
    } else if (max_price !== undefined) {
      sql += " AND price <= ?";
      params.push(Number(max_price));
    }

    sql += ` ORDER BY ${order_by} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(pageLimit, pageOffset);

    const books = await dbAll(sql, params);

    response.status(200).json(books);
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
});

// GET /books/:id - Get a particular book
app.get("/books/:id", async (request, response) => {
  try {
    const { id } = request.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return response.status(400).json({
        message: "Invalid book id",
      });
    }

    const book = await dbGet(
      "SELECT * FROM book WHERE id = ?",
      [Number(id)]
    );

    if (!book) {
      return response.status(404).json({
        message: "Book not found",
      });
    }

    response.status(200).json(book);
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
});

// POST /books - Add a new book
app.post("/books", async (request, response) => {
  try {
    const { title, author, price, pages } = request.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return response.status(400).json({
        message: "Title, author and a valid numeric price are required",
      });
    }

    if (
      pages !== undefined &&
      (!Number.isInteger(pages) || pages < 0)
    ) {
      return response.status(400).json({
        message: "Pages must be a non-negative integer",
      });
    }

    const result = await dbRun(
      `INSERT INTO book (title, author, price, pages)
       VALUES (?, ?, ?, ?)`,
      [title.trim(), author.trim(), price, pages ?? 0]
    );

    response.status(201).json({
      message: "Book added successfully",
      bookId: result.lastID,
    });
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
});

// PUT /books/:id - Update a book
app.put("/books/:id", async (request, response) => {
  try {
    const { id } = request.params;
    const { title, author, price, pages } = request.body;

    if (!/^[1-9]\d*$/.test(id)) {
      return response.status(400).json({
        message: "Invalid book id",
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof author !== "string" ||
      !author.trim() ||
      price === undefined ||
      price === null ||
      price === "" ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return response.status(400).json({
        message: "Title, author and a valid numeric price are required",
      });
    }

    if (
      pages !== undefined &&
      (!Number.isInteger(pages) || pages < 0)
    ) {
      return response.status(400).json({
        message: "Pages must be a non-negative integer",
      });
    }

    const existingBook = await dbGet(
      "SELECT * FROM book WHERE id = ?",
      [Number(id)]
    );

    if (!existingBook) {
      return response.status(404).json({
        message: "Book not found",
      });
    }

    await dbRun(
      `UPDATE book
       SET title = ?, author = ?, price = ?, pages = ?
       WHERE id = ?`,
      [
        title.trim(),
        author.trim(),
        price,
        pages ?? existingBook.pages,
        Number(id),
      ]
    );

    response.status(200).json({
      message: "Book updated successfully",
    });
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
});

// DELETE /books/:id - Delete a book
app.delete("/books/:id", async (request, response) => {
  try {
    const { id } = request.params;

    if (!/^[1-9]\d*$/.test(id)) {
      return response.status(400).json({
        message: "Invalid book id",
      });
    }

    const existingBook = await dbGet(
      "SELECT * FROM book WHERE id = ?",
      [Number(id)]
    );

    if (!existingBook) {
      return response.status(404).json({
        message: "Book not found",
      });
    }

    await dbRun(
      "DELETE FROM book WHERE id = ?",
      [Number(id)]
    );

    response.status(200).json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    response.status(500).json({
      message: error.message,
    });
  }
});

// Start the application
initializeDBAndServer();
