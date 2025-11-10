# API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST /api/auth/register
Register a new student account.

**Request Body:**
```json
{
  "email": "student@virginia.edu",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "studentId": "STU001" // optional
}
```

**Response: 201 Created**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "student@virginia.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### POST /api/auth/login
Login to existing account.

**Request Body:**
```json
{
  "email": "student@virginia.edu",
  "password": "password123"
}
```

**Response: 200 OK**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "student@virginia.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### GET /api/auth/me
Get current user profile (requires authentication).

**Response: 200 OK**
```json
{
  "user": {
    "id": 1,
    "email": "student@virginia.edu",
    "firstName": "John",
    "lastName": "Doe",
    "role": "student"
  }
}
```

---

## Course Endpoints

### GET /api/courses/term/:termId
Get all courses for a specific term (requires authentication).

**Parameters:**
- `termId` (number) - The ID of the term

**Response: 200 OK**
```json
{
  "courses": [
    {
      "id": 1,
      "code": "LPPA 7110",
      "name": "Economics of Public Policy II",
      "course_type": "section",
      "section_number": "001",
      "capacity": 17,
      "schedule": "Tu/Th 11am-12:15pm",
      "instructor": "Dr. Smith",
      "group_code": "ECON",
      "group_name": "Economics",
      "current_requests": 12,
      "seats_remaining": 5
    }
  ],
  "count": 1
}
```

---

### GET /api/courses/terms/active
Get the currently active term (requires authentication).

**Response: 200 OK**
```json
{
  "term": {
    "id": 1,
    "name": "Spring 2026",
    "year": 2026,
    "season": "Spring",
    "selection_opens_at": "2025-11-01T00:00:00.000Z",
    "selection_closes_at": "2025-12-15T23:59:59.000Z",
    "is_active": true
  }
}
```

---

### GET /api/courses/terms/list
Get all terms (requires authentication).

**Response: 200 OK**
```json
{
  "terms": [
    {
      "id": 1,
      "name": "Spring 2026",
      "year": 2026,
      "season": "Spring",
      "selection_opens_at": "2025-11-01T00:00:00.000Z",
      "selection_closes_at": "2025-12-15T23:59:59.000Z",
      "is_active": true
    }
  ]
}
```

---

## Selection Endpoints

### GET /api/selections/term/:termId
Get current user's course selections for a term (requires authentication).

**Parameters:**
- `termId` (number) - The ID of the term

**Response: 200 OK**
```json
{
  "selections": [
    {
      "id": 1,
      "preference_rank": 1,
      "status": "pending",
      "course_id": 1,
      "code": "LPPA 7110",
      "name": "Economics of Public Policy II",
      "course_type": "section",
      "section_number": "001",
      "schedule": "Tu/Th 11am-12:15pm",
      "group_code": "ECON",
      "group_name": "Economics",
      "created_at": "2025-11-05T10:30:00.000Z"
    }
  ]
}
```

---

### POST /api/selections/select
Select or update a course selection (requires authentication).

**Request Body:**
```json
{
  "courseId": 1,
  "termId": 1,
  "preferenceRank": 1
}
```

**Response: 201 Created**
```json
{
  "message": "Selection saved successfully",
  "selection": {
    "id": 1,
    "user_id": 1,
    "course_id": 1,
    "term_id": 1,
    "preference_rank": 1,
    "status": "pending"
  }
}
```

**Notes:**
- `preferenceRank` must be 1, 2, or 3
- If a selection already exists for that rank, it will be replaced
- Real-time WebSocket event `course_updated` is broadcast to all users

---

### DELETE /api/selections/:selectionId
Remove a course selection (requires authentication).

**Parameters:**
- `selectionId` (number) - The ID of the selection to remove

**Response: 200 OK**
```json
{
  "message": "Selection removed successfully"
}
```

---

## Admin Endpoints

All admin endpoints require authentication with admin role.

### GET /api/admin/selections/term/:termId
View all student selections for a term (admin only).

**Parameters:**
- `termId` (number) - The ID of the term

**Response: 200 OK**
```json
{
  "students": [
    {
      "userId": 2,
      "firstName": "John",
      "lastName": "Doe",
      "email": "student@virginia.edu",
      "studentId": "STU001",
      "selections": [
        {
          "selectionId": 1,
          "preferenceRank": 1,
          "status": "pending",
          "courseId": 1,
          "code": "LPPA 7110",
          "name": "Economics of Public Policy II",
          "sectionNumber": "001",
          "groupCode": "ECON",
          "createdAt": "2025-11-05T10:30:00.000Z"
        }
      ]
    }
  ]
}
```

---

### POST /api/admin/terms
Create a new term (admin only).

**Request Body:**
```json
{
  "name": "Fall 2026",
  "year": 2026,
  "season": "Fall",
  "selectionOpensAt": "2026-04-01T00:00:00.000Z",
  "selectionClosesAt": "2026-05-15T23:59:59.000Z",
  "isActive": true
}
```

**Response: 201 Created**
```json
{
  "term": {
    "id": 2,
    "name": "Fall 2026",
    "year": 2026,
    "season": "Fall",
    "selection_opens_at": "2026-04-01T00:00:00.000Z",
    "selection_closes_at": "2026-05-15T23:59:59.000Z",
    "is_active": true
  }
}
```

---

### POST /api/admin/courses/upload
Upload courses via CSV file (admin only).

**Request:**
- Content-Type: `multipart/form-data`
- Body:
  - `file` (file) - CSV file containing courses
  - `termId` (number) - The ID of the term

**CSV Format:**
```csv
group_code,course_code,course_name,course_type,section_number,capacity,schedule,instructor,room
ECON,LPPA 7110,Economics of Public Policy II,section,001,17,Tu/Th 11am-12:15pm,Dr. Smith,Room 101
```

**Response: 200 OK**
```json
{
  "message": "Successfully uploaded 18 courses"
}
```

---

### POST /api/admin/optimize/:termId
Run the optimization algorithm for course assignments (admin only).

**Parameters:**
- `termId` (number) - The ID of the term

**Response: 200 OK**
```json
{
  "message": "Optimization completed successfully",
  "output": "... optimization statistics ..."
}
```

**Notes:**
- This runs the Python optimization script
- WebSocket event `assignments_updated` is broadcast when complete
- Process may take several seconds depending on number of students

---

### GET /api/admin/assignments/:termId
Get optimization results and final course assignments (admin only).

**Parameters:**
- `termId` (number) - The ID of the term

**Response: 200 OK**
```json
{
  "assignments": [
    {
      "user_id": 2,
      "first_name": "John",
      "last_name": "Doe",
      "email": "student@virginia.edu",
      "assigned_preference": 1,
      "course_id": 1,
      "code": "LPPA 7110",
      "name": "Economics of Public Policy II",
      "section_number": "001",
      "group_code": "ECON",
      "assigned_at": "2025-11-10T15:30:00.000Z"
    }
  ]
}
```

---

## WebSocket Events

Connect to WebSocket server: `ws://localhost:3001`

### Client → Server Events

#### `authenticate`
Authenticate the WebSocket connection.

**Payload:**
```json
"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

#### `join_term`
Join a term room to receive real-time updates.

**Payload:**
```json
1
```
(termId as number)

---

#### `leave_term`
Leave a term room.

**Payload:**
```json
1
```
(termId as number)

---

### Server → Client Events

#### `authenticated`
Confirmation of successful authentication.

**Payload:**
```json
{
  "userId": 1,
  "role": "student"
}
```

---

#### `authentication_error`
Authentication failed.

**Payload:**
```json
{
  "message": "Invalid token"
}
```

---

#### `course_updated`
Real-time course availability update.

**Payload:**
```json
{
  "id": 1,
  "code": "LPPA 7110",
  "capacity": 17,
  "current_requests": 13,
  "seats_remaining": 4
}
```

---

#### `assignments_updated`
Notification that course assignments have been updated.

**Payload:**
```json
{
  "termId": 1
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": {
    "message": "All fields are required"
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "message": "Access token required"
  }
}
```

### 403 Forbidden
```json
{
  "error": {
    "message": "Admin access required"
  }
}
```

### 404 Not Found
```json
{
  "error": {
    "message": "Resource not found"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "message": "Internal server error"
  }
}
```

---

## Rate Limiting

- Limit: 100 requests per 15 minutes per IP address
- Applies to all `/api/*` endpoints
- Returns 429 Too Many Requests when exceeded

---

## CORS

The API accepts requests from:
- `http://localhost:3000` (development)
- Configured origins in production

---

## Testing with cURL

### Register
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@virginia.edu",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@batten.virginia.edu",
    "password": "admin123"
  }'
```

### Get Courses (with token)
```bash
curl http://localhost:3001/api/courses/term/1 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Select Course
```bash
curl -X POST http://localhost:3001/api/selections/select \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "courseId": 1,
    "termId": 1,
    "preferenceRank": 1
  }'
```

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- JWT tokens expire after 7 days
- Mock mode uses in-memory storage (data resets on server restart)
- Production mode requires PostgreSQL database
