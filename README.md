# Misinformation Detector - Chrome Extension

A Chrome extension that allows users to flag and detect misinformation, harmful content, and other problematic information on websites. Users can highlight text, images, or videos, flag them with specific categories, and view previously flagged content when visiting the same pages.

## Features

### Flagging Feature
- **Highlight & Flag Content**: Select text, images, or videos on any webpage
- **Categorization**: Flag content as:
  - Scam
  - Misinformation
  - Fake Profile
  - Other
- **AI-Powered Verification** (Optional): Use your own OpenAI API key to verify misinformation flags with web search
- **Add Notes**: Include optional notes with your flags
- **Confidence Levels**: Indicate how confident you are in your flag (0-100%)
- **Persistent Storage**: All flags are stored in a Supabase database

### Viewer Feature
- **Auto-Detection**: Automatically highlights previously flagged content when you visit a page
- **Visual Indicators**: Different colors for different flag types
- **Click for Details**: Click highlighted content to see why it was flagged
- **Flag Count**: View the number of flags on the current page

## Project Structure

```
d-acc-misinformation-plug-in/
├── extension/                 # Browser extension
│   ├── manifest.json          # Chrome extension manifest
│   ├── content.js             # Content script for page interaction
│   ├── content.css            # Styles for highlights and UI
│   ├── popup.html             # Extension popup UI
│   ├── popup.css              # Popup styles
│   ├── popup.js               # Popup logic
│   ├── llm-verify/            # LLM verification module (isolated)
│   │   ├── verifier.js        # Main LLM verification logic
│   │   ├── prompt-template.js # Prompt template for verification
│   │   └── README.md          # LLM module documentation
│   ├── icons/                 # Extension icons
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   ├── tests/                 # Extension tests
│   ├── generate-icons.py      # Script to generate placeholder icons
│   └── package.json           # Extension dependencies
├── webapp/                    # Web application (future)
├── api/                       # Backend API server
│   ├── server.js              # Express API server
│   └── package.json           # API dependencies
├── supabase/                  # Database configuration
│   ├── migrations/
│   │   └── 001_create_flagged_content_table.sql
│   └── kong.yml               # Kong API gateway config
├── config.json                # Database configuration
├── docker-compose.simple.yml  # Local database setup
├── init.sql                   # Database initialization
└── README.md                  # This file
```

## Prerequisites

- Google Chrome browser
- Docker and Docker Compose (for local development)
- Python 3 with Pillow (optional, for generating icons)

## Quick Setup

### 1. Start the local database

```bash
docker compose up -d
```

This starts PostgreSQL + PostgREST on port 3001.

### 2. Load the extension in Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/` directory
5. In the extension popup settings, choose "Local" mode

Done! The extension will use `http://localhost:3001` automatically.

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
2. Click "Settings" to configure:
   - **Database Connection**: Choose between Global or Manual server
   - **OpenAI API Key** (Optional): Enable AI-powered verification of flags
3. Click "Save Settings"

### AI Verification (Optional)

To enable AI-powered fact-checking:

1. Get an OpenAI API key from [platform.openai.com](https://platform.openai.com)
2. Open extension settings and paste your key in the "OpenAI API Key" field
3. When flagging content as "misinformation" or "scam":
   - The AI will verify your claim using web search
   - If it disagrees, you'll see reasoning and sources
   - You can still flag the content if you choose to

**Note**: Your API key is stored locally in your browser and only sent to OpenAI's servers.

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
