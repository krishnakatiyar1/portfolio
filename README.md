# Portfolio

Personal portfolio website with an Express backend for saving contact form messages to MongoDB.

## Run Locally

1. Install backend dependencies:

```bash
cd backend
npm install
```

2. Create `backend/.env` from `backend/.env.example` and add your MongoDB connection string:

```bash
MONGODB_URI=your_mongodb_connection_string
PORT=5000
```

3. Start the backend:

```bash
npm start
```

4. From the project root, start the frontend:

```bash
python -m http.server 5500
```

5. Open:

```text
http://localhost:5500
```

Contact form submissions are saved in the MongoDB `messages` collection.
