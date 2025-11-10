# Accelerated Course Selection System

A real-time web application for managing course selection for the Frank Batten School's accelerated program. This system replaces Salesforce with a modern, purpose-built solution featuring live seat availability updates and an optimization algorithm for course assignments.

## Features

- **Real-time Updates**: WebSocket-powered live seat availability across all connected users
- **Student Portal**: Browse courses, see availability, submit ranked preferences (1st, 2nd, 3rd choice)
- **Admin Dashboard**: Upload courses via CSV, manage capacities, view all student selections
- **Optimization Algorithm**: Weighted assignment system maximizing student satisfaction
- **Secure Authentication**: JWT-based auth with role-based access (student/admin)

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL database
- Socket.io for real-time updates
- JWT authentication
- Python optimization algorithm

### Frontend
- React 18
- Vite build tool
- Tailwind CSS
- Socket.io client
- Axios for API calls

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- Python 3.x (for optimization algorithm)
- npm or yarn

## Installation

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb course_selection

# Or using psql:
psql -U postgres
CREATE DATABASE course_selection;
\q
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=course_selection
DB_USER=postgres
DB_PASSWORD=your_password_here

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_key_here_change_in_production

# CORS Origin (frontend URL)
CORS_ORIGIN=http://localhost:3000
```

### 4. Run Database Migration

```bash
npm run db:migrate
```

This will create all necessary tables, indexes, and views.

### 5. Install Python Dependencies

```bash
pip install psycopg2-binary python-dotenv
```

## Running the Application

### Development Mode (Full Stack)

```bash
# Run both backend and frontend concurrently
npm run dev:full
```

This starts:
- Backend server on `http://localhost:3001`
- Frontend dev server on `http://localhost:3000`

### Individual Services

```bash
# Backend only
npm run dev

# Frontend only
npm run client
```

### Production Build

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## Default Admin Account

A default admin account is created during migration:

- **Email**: `admin@batten.virginia.edu`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login in production!

## Usage

### For Students

1. Register an account or login
2. View available courses grouped by subject (ECON, RMDA, POLICY, etc.)
3. Select your 1st, 2nd, and 3rd choice courses
4. See real-time seat availability updates
5. Wait for admin to run optimization algorithm
6. View your course assignment

### For Admins

1. Login with admin credentials
2. **Upload Courses**: Use CSV upload to add courses for a term
3. **View Selections**: Monitor student course preferences in real-time
4. **Run Optimization**: Execute the assignment algorithm when selection period closes
5. **View Results**: See optimization statistics and final assignments

## CSV Upload Format

Courses can be uploaded via CSV with the following columns:

```csv
group_code,course_code,course_name,course_type,section_number,capacity,schedule,instructor,room
ECON,LPPA 7110,Economics of Public Policy II,section,001,17,Tu/Th 11am-12:15pm,Dr. Smith,Room 101
ECON,LPPA 7110,Economics of Public Policy II,discussion,100,8,M 5-5:50pm,TA Name,Room 102
RMDA,LPPA 7160,Research Methods and Data Analysis II,section,001,16,M/W 9:30-10:45am,Dr. Jones,Room 201
```

## Optimization Algorithm

The assignment algorithm uses a weighted scoring system:

- **1st Choice**: 3 points
- **2nd Choice**: 2 points
- **3rd Choice**: 1 point

The algorithm maximizes total student satisfaction while respecting course capacity constraints. It uses a greedy approach with randomization for fairness.

### Running Optimization Manually

```bash
npm run algorithm <term_id>
```

Or directly:

```bash
python server/algorithm/optimize.py <term_id>
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify` - Verify token

### Courses
- `GET /api/courses/term/:termId` - Get courses for term
- `GET /api/courses/terms/active` - Get active term
- `GET /api/courses/term/:termId/grouped` - Get courses grouped by subject

### Selections (Student)
- `GET /api/selections/term/:termId` - Get user's selections
- `POST /api/selections/select` - Select a course
- `DELETE /api/selections/:selectionId` - Remove selection

### Admin
- `GET /api/admin/selections/term/:termId` - View all student selections
- `POST /api/admin/terms` - Create new term
- `POST /api/admin/courses/upload` - Upload courses CSV
- `POST /api/admin/optimize/:termId` - Run optimization
- `GET /api/admin/assignments/:termId` - View optimization results

## WebSocket Events

### Client → Server
- `authenticate` - Authenticate socket connection
- `join_term` - Join term room for updates
- `leave_term` - Leave term room

### Server → Client
- `authenticated` - Confirmation of authentication
- `course_updated` - Real-time course availability update
- `assignments_updated` - Notification of new assignments

## Project Structure

```
AccelCourseSelection/
├── server/
│   ├── algorithm/         # Python optimization script
│   ├── database/          # DB config and migrations
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   └── index.js           # Express server
├── client/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and Socket services
│   │   └── context/       # React context
│   └── public/            # Static files
├── package.json
└── README.md
```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers
- SQL injection protection via parameterized queries

## Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running and credentials in `.env` are correct:

```bash
psql -U postgres -d course_selection
```

### WebSocket Connection Fails

Check that:
- Backend is running on the correct port
- CORS_ORIGIN matches your frontend URL
- No firewall blocking WebSocket connections

### Python Script Errors

Verify Python dependencies are installed:

```bash
pip list | grep psycopg2
pip list | grep python-dotenv
```

## Future Enhancements

- Email notifications for course assignments
- Waitlist management system
- Course conflict detection (schedule overlap)
- Mobile-responsive design improvements
- Export functionality for admin reports
- Integration with university authentication (SSO)

## License

MIT

## Support

For issues or questions, contact the Frank Batten School IT department.
