# Misinformation Detector - Chrome Extension

A Chrome extension that allows users to flag and detect misinformation, harmful content, and other problematic information on websites. Users can highlight text, images, or videos, flag them with specific categories, and view previously flagged content when visiting the same pages.

## Features

### Flagging Feature
- **Highlight & Flag Content**: Select text, images, or videos on any webpage
- **Categorization**: Flag content as:
  - AI Misinformation
  - Harmful Information
  - Misleading Content
  - Other
- **Add Notes**: Include optional notes with your flags
- **Persistent Storage**: All flags are stored in a Supabase database

### Viewer Feature
- **Auto-Detection**: Automatically highlights previously flagged content when you visit a page
- **Visual Indicators**: Different colors for different flag types
- **Click for Details**: Click highlighted content to see why it was flagged
- **Flag Count**: View the number of flags on the current page

## Project Structure

```
d-acc-misinformation-plug-in/
├── manifest.json              # Chrome extension manifest
├── content.js                 # Content script for page interaction
├── content.css                # Styles for highlights and UI
├── popup.html                 # Extension popup UI
├── popup.css                  # Popup styles
├── popup.js                   # Popup logic
├── config.json                # Database configuration
├── icons/                     # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── supabase/                  # Database configuration
│   ├── migrations/
│   │   └── 001_create_flagged_content_table.sql
│   └── kong.yml               # Kong API gateway config
├── docker-compose.yml         # Local Supabase setup
├── generate-icons.py          # Script to generate placeholder icons
└── README.md                  # This file
```

## Prerequisites

- Google Chrome browser
- Docker and Docker Compose (for local development)
- Python 3 with Pillow (optional, for generating icons)

## Setup Instructions

### 1. Clone the Repository

```bash
cd d-acc-misinformation-plug-in
```

### 2. Generate Extension Icons

You need to create icons for the extension. You can either:

**Option A: Generate placeholder icons with Python**
```bash
pip install Pillow
python3 generate-icons.py
```

**Option B: Create custom icons manually**
- Create three PNG files in the `icons/` directory:
  - `icon16.png` (16x16 pixels)
  - `icon48.png` (48x48 pixels)
  - `icon128.png` (128x128 pixels)

### 3. Set Up Local Supabase Database

#### Start the Database

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 54322)
- Supabase API Gateway (port 54321)
- Supabase Studio (port 54323)

#### Verify the Database is Running

```bash
docker-compose ps
```

All services should show as "Up".

#### Access Supabase Studio (Optional)

Open http://localhost:54323 in your browser to view the database through Supabase Studio.

#### Run Migrations

The database migrations will run automatically when the database starts for the first time. The migration creates the `flagged_content` table with the following schema:

```sql
CREATE TABLE flagged_content (
  id UUID PRIMARY KEY,
  url TEXT NOT NULL,              -- Full URL where content was flagged
  page_url TEXT NOT NULL,         -- Page URL (without query params)
  content TEXT NOT NULL,          -- The flagged content
  content_type VARCHAR(50),       -- 'text', 'image', 'video', 'other'
  flag_type VARCHAR(50),          -- 'misinformation', 'harmful', 'misleading', 'other'
  note TEXT,                      -- Optional user note
  selector TEXT,                  -- CSS selector for precise location
  timestamp TIMESTAMPTZ,          -- When content was flagged
  created_at TIMESTAMPTZ          -- Record creation time
);
```

### 4. Configure the Extension

The extension uses the `config.json` file for database connection. The default configuration points to the local Docker Compose setup:

```json
{
  "supabaseUrl": "http://localhost:54321",
  "supabaseKey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

For production, update these values with your actual Supabase project credentials.

### 5. Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `d-acc-misinformation-plug-in` directory
5. The extension should now appear in your extensions list

## Usage

### Flagging Content

1. Navigate to any webpage
2. **For Text**: Highlight the text you want to flag
3. **For Images/Videos**: Click on the image or video
4. A popup will appear with flagging options:
   - Select the flag type (Misinformation, Harmful, Misleading, Other)
   - Optionally add a note
   - Click "Flag" to submit

### Viewing Flagged Content

1. Navigate to any webpage
2. The extension automatically checks for existing flags
3. Previously flagged content will be highlighted with colored borders:
   - **Red**: Misinformation
   - **Orange**: Harmful
   - **Yellow**: Misleading
4. Click on highlighted content to see why it was flagged
5. Open the extension popup to see:
   - Number of flags on the current page
   - List of all flagged items

### Managing Settings

1. Click the extension icon to open the popup
2. Click "Settings" to configure database connection
3. Enter your Supabase URL and API key
4. Click "Save Settings"

## Development

### Local Development with Docker

The `docker-compose.yml` file provides a complete local Supabase environment:

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

### Database Management

**Access PostgreSQL directly:**
```bash
docker-compose exec db psql -U postgres
```

**View API documentation:**
- Supabase Studio: http://localhost:54323
- REST API: http://localhost:54321/rest/v1/

### Modifying the Database Schema

1. Create a new migration file in `supabase/migrations/`
2. Name it with an incrementing number: `002_your_migration.sql`
3. Restart the database to apply migrations:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Extension Development

After making changes to the extension code:

1. Go to `chrome://extensions/`
2. Click the refresh icon on the extension card
3. Reload any open webpages to see changes

## Production Deployment

### 1. Set Up Supabase Project

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project's URL and `anon` public key

### 2. Run Database Migrations

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push migrations:
   ```bash
   supabase db push
   ```

### 3. Update Extension Configuration

Update `config.json` with your production credentials:

```json
{
  "supabaseUrl": "https://your-project.supabase.co",
  "supabaseKey": "your-anon-public-key"
}
```

### 4. Package Extension

1. Remove development files:
   ```bash
   rm -rf .git supabase docker-compose.yml .env.example
   ```

2. Zip the extension:
   ```bash
   zip -r misinformation-detector.zip . -x "*.git*" "node_modules/*"
   ```

3. Upload to Chrome Web Store:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Upload the ZIP file
   - Fill in store listing details
   - Submit for review

## Security Considerations

- **Row Level Security (RLS)**: The database has RLS enabled with public read/write access. For production, consider implementing user authentication and more restrictive policies.
- **API Keys**: Never commit real API keys to version control. The keys in this repository are for local development only.
- **Content Validation**: Consider adding server-side validation to prevent spam or malicious flags.
- **Rate Limiting**: Implement rate limiting to prevent abuse.

## Troubleshooting

### Extension doesn't load
- Check that all required files exist (manifest.json, content.js, etc.)
- Verify icon files exist in the `icons/` directory
- Check the Chrome Extensions page for error messages

### Database connection fails
- Verify Docker containers are running: `docker-compose ps`
- Check that port 54321 is not in use by another service
- Review Docker logs: `docker-compose logs`

### Flags don't appear
- Open browser console (F12) and check for errors
- Verify the database contains records for the current page
- Try refreshing the page
- Check that the Supabase URL in config.json is correct

### Can't flag content
- Check browser console for errors
- Verify database is accessible
- Ensure the extension has permissions for the current site

## Future Enhancements

- [ ] User authentication and user-specific flags
- [ ] Voting system for flag accuracy
- [ ] Browser extension for Firefox and Edge
- [ ] API for third-party integrations
- [ ] Machine learning to auto-detect potential misinformation
- [ ] Export flagged content data
- [ ] Browser notifications for heavily flagged pages
- [ ] Community moderation features

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for any purpose.

## Support

For issues and questions:
- Open an issue in the GitHub repository
- Check existing issues for solutions
- Review the troubleshooting section above

---

**Note**: This is an educational project. Always verify information from multiple reliable sources, and use critical thinking when evaluating online content.
