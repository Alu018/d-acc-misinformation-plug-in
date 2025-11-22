# Misinformation Detector - Web Application

A Next.js web application that provides a public interface to browse and search flagged content from the Misinformation Detector Chrome Extension.

## Features

- **Real-time Database Integration**: Connects to Supabase to display flagged content
- **Advanced Filtering**: Filter by content type, flag type, and confidence level
- **Search Functionality**: Search through content, notes, and URLs
- **Statistics Dashboard**: View statistics about flagged content
- **Responsive Design**: Fully responsive UI built with Tailwind CSS
- **Interactive Table**: Expandable rows to view full content and notes

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Date Formatting**: date-fns

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Running Supabase instance (local or cloud)

## Setup Instructions

### 1. Install Dependencies

```bash
cd webapp
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**For local development** using Docker Compose (from parent directory):
- URL: `http://localhost:54321`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`

**For production** using Supabase Cloud:
- URL: `https://your-project.supabase.co`
- Key: Your project's anon/public key

### 3. Start the Database (if using local Docker Compose)

From the parent directory:

```bash
docker-compose up -d
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
webapp/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main page component
│   └── globals.css         # Global styles
├── components/
│   ├── FlaggedContentTable.tsx  # Table component
│   ├── FilterBar.tsx            # Filter controls
│   └── StatsBar.tsx             # Statistics display
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── types.ts            # TypeScript types
├── .env.local              # Environment variables (gitignored)
├── .env.example            # Environment template
└── package.json            # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Statistics Bar

Displays aggregate statistics:
- Total number of flags
- Count by flag type (scam, misinformation, other)
- Count by confidence level (certain, uncertain)

### Filter Bar

Multiple filtering options:
- **Search**: Search content, notes, and URLs
- **Content Type**: Filter by text, image, video, or other
- **Flag Type**: Filter by scam, misinformation, or other
- **Confidence**: Filter by certain or uncertain

### Content Table

Interactive table showing:
- Content type icon
- Flag type badge
- Confidence level badge
- Truncated content (expandable)
- Page URL (clickable)
- Creation date and time
- Expand/collapse functionality

## Database Schema

The app expects a `flagged_content` table with the following structure:

```sql
CREATE TABLE flagged_content (
  id SERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  page_url TEXT NOT NULL,
  content TEXT NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('text', 'image', 'video', 'other')),
  flag_type VARCHAR(50) NOT NULL CHECK (flag_type IN ('scam', 'misinformation', 'other')),
  confidence VARCHAR(20) DEFAULT 'certain' CHECK (confidence IN ('certain', 'uncertain')),
  note TEXT,
  selector TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- Render
- Self-hosted with Docker

Build command: `npm run build`
Start command: `npm start`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |

Note: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Security Considerations

- The app uses Supabase's anonymous key for read-only access
- Ensure Row Level Security (RLS) policies are configured in Supabase
- All data is publicly accessible through this interface
- Consider implementing rate limiting for production deployments

## Troubleshooting

### Connection Issues

If the app can't connect to Supabase:
1. Verify environment variables are set correctly
2. Check that Supabase is running (for local development)
3. Verify network connectivity
4. Check browser console for errors

### No Data Displayed

If no data appears:
1. Verify the database has records
2. Check Supabase RLS policies allow anonymous reads
3. Inspect network requests in browser DevTools
4. Check for CORS issues (local development)

### Build Errors

If the build fails:
1. Clear `.next` directory: `rm -rf .next`
2. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
3. Check for TypeScript errors: `npm run build`

## Contributing

Contributions are welcome! Please ensure:
- Code follows the existing style
- TypeScript types are properly defined
- Components are documented
- Changes are tested locally

## License

MIT License - see parent directory for full license text

## Related Projects

- [Chrome Extension](../extension) - Browser extension for flagging content
- [API Server](../api) - Backend API server (if applicable)

## Support

For issues or questions:
- Check the main project README in the parent directory
- Open an issue on GitHub
- Review Supabase documentation at [supabase.com/docs](https://supabase.com/docs)

---

Built with Next.js and Supabase
