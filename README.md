# Lab 3: REST API, Query Parameters, Validation and Debugging

## Student Details

- **Name:** Gudipudi Dharani Sree
- **Registration Number:** 252U1R9043
- **Section:** GEN-AI-2A
- **Course:** Backend Development Fundamentals
- **Year:** II Year, Term II
- **University:** Aurora Deemed to be University
- **Faculty:** Joel Prashanth D.

## Live Link

The project is currently running locally on:

`http://localhost:3000/`

## Project Description

This project focuses on developing a RESTful API using Node.js, Express.js and SQLite.

The API manages book records and supports CRUD operations such as adding, viewing, updating and deleting books.

It also includes search functionality, sorting, pagination, price filtering, request validation and error handling.

## Technologies Used

- Node.js
- Express.js
- SQLite
- JavaScript
- Postman
- Visual Studio Code

## Project Structure

```text
lab-03/
│
├── app.js
├── database.db
├── package.json
├── package-lock.json
├── README.md
├── .gitignore
│
└── screenshots/
    ├── get-all-books.png
    ├── get-single-book.png
    ├── search-books.png
    ├── sort-books.png
    ├── pagination.png
    ├── price-filter.png
    ├── post-success.png
    ├── post-validation-error.png
    ├── update-book.png
    └── delete-book.png
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

### 2. Open the project folder

```bash
cd lab-03
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the server

```bash
npm start
```

The server runs at:

`http://localhost:3000/`

Make sure the SQLite database file `database.db` is present in the project folder.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/books` | Get all books |
| GET | `/books/:id` | Get a single book |
| POST | `/books` | Add a new book |
| PUT | `/books/:id` | Update a book |
| DELETE | `/books/:id` | Delete a book |

## Query Parameters

| Parameter | Description | Example |
|---|---|---|
| search_q | Search books by title | `?search_q=Harry` |
| order_by | Select sorting column | `?order_by=price` |
| order | Ascending or descending | `?order=ASC` |
| limit | Number of records | `?limit=5` |
| offset | Starting record position | `?offset=5` |
| min_price | Minimum book price | `?min_price=100` |
| max_price | Maximum book price | `?max_price=500` |

### Example Requests

**Search books:**

```text
GET /books?search_q=Harry
```

**Sort books:**

```text
GET /books?order_by=price&order=ASC
```

**Pagination:**

```text
GET /books?limit=5&offset=0
```

**Filter by price:**

```text
GET /books?min_price=100&max_price=500
```

## HTTP Status Codes

| Status Code | Description |
|---|---|
| 200 | Successful request |
| 201 | Book created successfully |
| 400 | Invalid request or missing fields |
| 404 | Book not found |
| 500 | Internal server error |

## Request Validation

The API validates the request body before inserting a book.

- Title should not be empty.
- Author should not be empty.
- Price must be numeric.
- Invalid requests return a 400 status code.
- Missing book IDs return a 404 status code.

## Screenshots

Add screenshots of your actual Postman results below.

### 1. Get All Books

![Get All Books](<Screenshot 2026-11-10 135557.png>)

### 2. Get Single Book

![Get Single Book]!(<Screenshot 2026-11-10 135712.png>)

### 3. Search Books

![Search Books]!(<Screenshot 2026-11-10 135843.png>)

### 4. Sorting

![Sorting]!(<Screenshot 2026-11-10 135909.png>)

### 5. Pagination

![Pagination]!(<Screenshot 2026-11-10 135929.png>)

### 6. Price Filtering

![Price Filtering]!(<Screenshot 2026-11-10 135945.png>)

### 7. Add Book Successfully

![Add Book]!(<Screenshot 2026-11-10 140002.png>)

### 8. POST Validation Error

![Validation Error]!(<Screenshot 2026-11-10 140002-1.png>)

### 9. Update Book

![Update Book]!(<Screenshot 2026-11-10 140042.png>)

### 10. Delete Book

![Delete Book]!(<Screenshot 2026-11-10 140118.png>)

