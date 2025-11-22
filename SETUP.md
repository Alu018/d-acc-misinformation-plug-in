# Simple Setup for Rapid Prototyping

## Quick Start

1. **Start the database:**
   ```bash
   docker compose -f docker-compose.simple.yml up -d
   ```

2. **Install API dependencies:**
   ```bash
   cd api
   npm install
   ```

3. **Start the API server:**
   ```bash
   npm start
   # or for auto-reload during development:
   npm run dev
   ```

4. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this directory

## That's it!

The extension will now connect to:
- Database: PostgreSQL on `localhost:5432`
- API: Express server on `http://localhost:3000`

## Making Schema Changes

Just edit `init.sql` and recreate the database:
```bash
docker compose -f docker-compose.simple.yml down -v
docker compose -f docker-compose.simple.yml up -d
```

## Stopping Everything

```bash
# Stop database
docker compose -f docker-compose.simple.yml down

# Stop API (Ctrl+C in the terminal)
```
