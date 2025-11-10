# Feature Documentation

## Current Features (v1.0)

### 1. Course Selection System
Students can select their top 3 course preferences from available courses.

**Implementation:**
- Real-time seat availability tracking
- WebSocket updates for instant feedback
- Preference ranking (1st, 2nd, 3rd choice)
- Visual course grouping by subject (ECON, RMDA, POLICY)

**User Flow:**
1. Student logs in
2. Views available courses with current seat availability
3. Selects up to 3 courses in ranked order
4. Can modify selections before deadline
5. Admin runs optimization algorithm
6. Student receives course assignment

### 2. Real-Time Updates
Live seat count updates across all connected users.

**Technical Details:**
- Socket.io WebSocket connections
- Broadcasts course updates to all users in a term
- No page refresh needed
- Updates propagate within milliseconds

### 3. Admin Dashboard
Comprehensive admin interface for course and selection management.

**Features:**
- View all student selections
- Upload courses via CSV
- Run optimization algorithm
- View statistics (total students, selections, completion rate)
- Monitor selection status

### 4. Optimization Algorithm
Weighted assignment system for fair course distribution.

**Algorithm Details:**
- Scoring: 1st choice = 3 points, 2nd = 2 points, 3rd = 1 point
- Maximizes total student satisfaction
- Respects course capacity constraints
- Randomization for fairness
- Generates detailed statistics

### 5. Authentication & Security
JWT-based authentication with role-based access control.

**Security Features:**
- Bcrypt password hashing
- JWT tokens (7-day expiration)
- Role-based access (student/admin)
- Rate limiting on API endpoints
- CORS protection
- Helmet.js security headers

---

## Planned Features (Based on Gianpaolo's Email)

### 6. Waitlist Functionality (PLANNED)
Allow students to join waitlists for full courses.

**Proposed Implementation:**
```
Status levels:
- Available: Course has seats
- Full: Course at capacity, show waitlist option
- Waitlisted: Student on waitlist (ordered by timestamp)
- Enrolled: Student successfully enrolled

Workflow:
1. When course capacity reached, show "Join Waitlist" button
2. Students can waitlist instead of selecting
3. Admin can see waitlist positions
4. When spot opens, first waitlisted student gets notified
5. Auto-assign from waitlist or manual approval
```

**Database Changes Needed:**
```sql
ALTER TABLE student_selections
ADD COLUMN waitlist_position INTEGER,
ADD COLUMN waitlist_joined_at TIMESTAMP;

-- Update status enum to include 'waitlisted'
```

**UI Changes:**
- Badge showing "Waitlist Available" on full courses
- Waitlist position display for students
- Admin view of waitlist queues
- Notification system for waitlist updates

### 7. Elective Interests Tracking (PLANNED)
Allow students to note additional elective interests.

**Proposed Implementation:**
```
Feature Description:
- Separate section for elective interests
- Not counted toward 3 required choices
- Used for planning future offerings
- Optional field

Database Schema:
CREATE TABLE elective_interests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  term_id INTEGER REFERENCES terms(id),
  course_area VARCHAR(100), -- e.g., "Data Science", "Public Finance"
  interest_level VARCHAR(20), -- 'high', 'medium', 'low'
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**UI Components:**
- Separate "Elective Interests" section below main selections
- Dropdown or checkboxes for course areas
- Optional notes field
- Save independently from required selections
- Admin analytics view for popular electives

### 8. Confirmation Page (PLANNED)
Final confirmation page with clear language.

**Proposed Language:**

**For Students:**
```
Course Selection Confirmation

You have successfully submitted your course preferences for [TERM NAME].

Your Selections:
✓ 1st Choice: [COURSE CODE] - [COURSE NAME] (Section [NUMBER])
✓ 2nd Choice: [COURSE CODE] - [COURSE NAME] (Section [NUMBER])
✓ 3rd Choice: [COURSE CODE] - [COURSE NAME] (Section [NUMBER])

[If Waitlisted]
Waitlist:
○ [COURSE CODE] - [COURSE NAME] (Position: #[NUMBER])

[If Electives Noted]
Elective Interests:
- [INTEREST AREA 1]
- [INTEREST AREA 2]

Important Information:
• Selection Period Closes: [DATE] at [TIME]
• You may modify your selections until the deadline
• The optimization algorithm will run on [DATE]
• You will receive an email with your final course assignment
• Course assignments prioritize 1st choice, then 2nd, then 3rd

Questions? Contact [CONTACT EMAIL]
```

**For Waitlisted Students:**
```
Waitlist Confirmation

You have been added to the waitlist for:
[COURSE CODE] - [COURSE NAME] (Section [NUMBER])

Waitlist Position: #[NUMBER]
Added to Waitlist: [DATE & TIME]

What happens next:
1. If a spot becomes available, you will be notified via email
2. You will have 24 hours to confirm your enrollment
3. If you do not respond, the spot will go to the next student
4. Your other course selections remain active

You can view your waitlist status at any time by logging into the course selection system.
```

**For Electives:**
```
Thank you for sharing your elective interests!

You indicated interest in:
[LIST OF ELECTIVE AREAS]

This information helps us:
• Plan future course offerings
• Understand student demand
• Develop new curriculum

Note: Elective interests are not guaranteed course placements. They are for planning purposes only.
```

---

## Implementation Priority

### Phase 1 (Current - COMPLETE)
✅ Core course selection
✅ Real-time updates
✅ Admin dashboard
✅ Optimization algorithm
✅ Authentication

### Phase 2 (Next - IN PROGRESS)
🟡 UVA branding and styling
🟡 Waitlist functionality
🟡 Elective interests tracking
🟡 Confirmation pages with proper language

### Phase 3 (Future)
- Email notifications
- Schedule conflict detection
- Mobile app
- Historical data analytics
- Advanced reporting
- SSO integration

---

## Testing Checklist

Before deploying waitlist and elective features:

**Waitlist Testing:**
- [ ] Student can join waitlist when course is full
- [ ] Waitlist positions are correctly ordered
- [ ] Student receives notification when spot available
- [ ] Admin can view all waitlists
- [ ] Waitlist students correctly assigned when spots open
- [ ] Students can remove themselves from waitlist

**Elective Testing:**
- [ ] Students can select multiple elective interests
- [ ] Electives save independently from required selections
- [ ] Admin can view aggregate elective interest data
- [ ] Electives don't affect optimization algorithm
- [ ] Students can update elective interests

**Confirmation Page Testing:**
- [ ] All languages display correctly
- [ ] Dynamic data (dates, names, courses) populates correctly
- [ ] Different states show appropriate messages (confirmed, waitlisted, etc.)
- [ ] Confirmation can be printed or saved as PDF
- [ ] Email confirmation sent with same information

---

## Technical Notes

### Waitlist Algorithm
```javascript
// When a student drops a course or capacity increases:
1. Get all waitlisted students for that course, ordered by waitlist_joined_at
2. Take first student from waitlist
3. Send notification email
4. Set temporary hold on seat (24 hours)
5. If student confirms within 24 hours:
   - Assign course
   - Remove from waitlist
6. If student doesn't respond or declines:
   - Release hold
   - Move to next waitlist student
   - Repeat process
```

### Elective Interest Analytics
```sql
-- Query to get popular elective interests
SELECT
  course_area,
  COUNT(*) as interest_count,
  AVG(CASE
    WHEN interest_level = 'high' THEN 3
    WHEN interest_level = 'medium' THEN 2
    WHEN interest_level = 'low' THEN 1
  END) as avg_interest_score
FROM elective_interests
WHERE term_id = ?
GROUP BY course_area
ORDER BY interest_count DESC, avg_interest_score DESC;
```

---

## API Endpoints to Add

### Waitlist
```
POST   /api/waitlist/join         - Join course waitlist
DELETE /api/waitlist/:id           - Leave waitlist
GET    /api/waitlist/course/:id    - Get waitlist for course
POST   /api/waitlist/confirm/:id   - Confirm waitlist spot
GET    /api/admin/waitlists/:termId - View all waitlists (admin)
```

### Electives
```
GET    /api/electives/term/:termId     - Get user's elective interests
POST   /api/electives                   - Add elective interest
PUT    /api/electives/:id               - Update elective interest
DELETE /api/electives/:id               - Remove elective interest
GET    /api/admin/electives/analytics/:termId - Get elective analytics (admin)
```

### Confirmation
```
GET    /api/confirmation/:termId        - Get confirmation data
POST   /api/confirmation/email/:termId  - Resend confirmation email
GET    /api/confirmation/pdf/:termId    - Download PDF confirmation
```

---

## Questions for Stakeholders

1. **Waitlist Policy:**
   - How long should students have to confirm waitlist spots? (24 hours?)
   - Should there be a limit to how many waitlists a student can join?
   - Priority rules: First-come-first-serve or by selection preference rank?

2. **Elective Interests:**
   - Pre-defined list of elective areas or free-form text?
   - Required field or optional?
   - Can students select multiple elective areas?

3. **Confirmation Page:**
   - Should confirmation be emailed automatically?
   - PDF download option needed?
   - What contact information should be displayed?

4. **Timeline:**
   - When should these features be live?
   - Testing period duration?
   - Training needed for admin users?
