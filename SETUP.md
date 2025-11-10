# Quick Setup Guide

This guide will help you get the Accelerated Course Selection System up and running quickly.

## Step 1: Prerequisites Check

Make sure you have the following installed:

```bash
node --version   # Should be v16 or higher
npm --version    # Should be v7 or higher
psql --version   # PostgreSQL v12 or higher
python --version # Python 3.x
```

## Step 2: Database Setup

```bash
# Create the database
createdb course_selection

# Or if using Windows/psql directly:
psql -U postgres
CREATE DATABASE course_selection;
\q
```

## Step 3: Install All Dependencies

```bash
# From the project root directory:
npm run install:all
```

This will install both backend and frontend dependencies.

## Step 4: Configure Environment

1. Copy `.env.example` to `.env`:
```bash
cp server/.env.example .env
```

2. Edit `.env` and update the following:
   - `DB_PASSWORD` - Your PostgreSQL password
   - `JWT_SECRET` - Generate a random string (use a password generator)
   - Other settings as needed

## Step 5: Initialize Database

```bash
npm run db:migrate
```

This creates all tables, indexes, and the default admin account.

## Step 6: Create a Test Term (Optional)

You can manually create a term using psql:

```bash
psql -U postgres -d course_selection
```

```sql
INSERT INTO terms (name, year, season, selection_opens_at, selection_closes_at, is_active)
VALUES ('Spring 2026', 2026, 'Spring', NOW(), NOW() + INTERVAL '30 days', true);
```

Get the term ID:
```sql
SELECT id FROM terms WHERE name = 'Spring 2026';
```

Exit psql:
```sql
\q
```

## Step 7: Start the Application

```bash
# Development mode (both frontend and backend)
npm run dev:full
```

Wait for both servers to start:
- Backend: http://localhost:3001
- Frontend: http://localhost:3000

## Step 8: Login and Test

1. Open browser to http://localhost:3000
2. Login with default admin:
   - Email: `admin@batten.virginia.edu`
   - Password: `admin123`
3. Upload sample courses using `sample_courses.csv`
4. Create a student account (or register new one)
5. Select courses as a student
6. Run optimization algorithm as admin

## Testing the System

### As Admin:
1. Login as admin
2. Upload courses: Use the provided `sample_courses.csv` file
3. View student selections in the admin dashboard
4. Run the optimization algorithm
5. View assignment results

### As Student:
1. Register a new student account
2. Browse available courses
3. Select 1st, 2nd, and 3rd choice courses
4. Watch real-time seat updates
5. Wait for admin to run optimization

## Troubleshooting

### "Cannot connect to database"
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `.env` file
- Test connection: `psql -U postgres -d course_selection`

### "Port 3000 already in use"
- Another app is using port 3000
- Change port in `client/vite.config.js`

### "Module not found" errors
- Run `npm run install:all` again
- Delete `node_modules` folders and reinstall

### WebSocket not connecting
- Ensure backend is running on port 3001
- Check browser console for errors
- Verify `CORS_ORIGIN` in `.env`

## Python Algorithm Setup

Install Python dependencies:

```bash
pip install psycopg2-binary python-dotenv
```

Test the algorithm:

```bash
python server/algorithm/optimize.py 1
```

(Replace `1` with your actual term ID)

## Next Steps

1. **Change Admin Password**: Login as admin and change the default password
2. **Create Terms**: Set up your actual course selection terms
3. **Upload Courses**: Use CSV upload or manually add courses
4. **Configure Selection Periods**: Set appropriate open/close dates
5. **Test with Sample Students**: Create test accounts and verify workflow
6. **Deploy to Production**: See deployment guide (coming soon)

## Quick Command Reference

```bash
# Development
npm run dev:full          # Run full stack in dev mode
npm run dev               # Backend only
npm run client            # Frontend only

# Database
npm run db:migrate        # Run database migrations

# Python Algorithm
npm run algorithm <term_id>  # Run optimization

# Production
npm run build             # Build frontend
npm start                 # Start production server
```

## Support

For issues, check:
1. README.md - Full documentation
2. Server logs - Check terminal output
3. Browser console - Check for frontend errors
4. Database - Verify data with `psql`

## Security Notes

Before deploying to production:
- Change the default admin password
- Generate a secure `JWT_SECRET`
- Use environment-specific `.env` files
- Enable HTTPS/SSL
- Review security headers and CORS settings
- Set up proper backup procedures
