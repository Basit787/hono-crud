### 1. Setting up environment variables

Copy contents from `.env.sample` and creaet and add into `.env`

### 2. Run database

Run following command ro run the database locally.

```bash
docker compose up
```

### 3. Run the application

Run the development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 4. Create table

If you are new to this project, run the following command to create tables into your local database

```bash
npm run migration
```
