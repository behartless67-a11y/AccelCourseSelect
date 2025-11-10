#!/usr/bin/env python3
"""
Course Assignment Optimization Algorithm
Assigns students to courses based on their preferences while respecting capacity constraints.
Uses a weighted scoring system: 1st choice = 3 points, 2nd choice = 2 points, 3rd choice = 1 point
"""

import sys
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
from collections import defaultdict
import random

# Load environment variables
load_dotenv()

def connect_db():
    """Connect to PostgreSQL database"""
    return psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=os.getenv('DB_PORT', 5432),
        database=os.getenv('DB_NAME', 'course_selection'),
        user=os.getenv('DB_USER', 'postgres'),
        password=os.getenv('DB_PASSWORD')
    )

def get_student_preferences(conn, term_id):
    """Get all student course preferences for the term"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT
            ss.user_id,
            ss.course_id,
            ss.preference_rank,
            c.capacity
        FROM student_selections ss
        JOIN courses c ON ss.course_id = c.id
        WHERE ss.term_id = %s
        ORDER BY ss.user_id, ss.preference_rank
    """, (term_id,))
    return cursor.fetchall()

def get_course_capacities(conn, term_id):
    """Get course capacities"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT id, capacity
        FROM courses
        WHERE term_id = %s
    """, (term_id,))
    return {row['id']: row['capacity'] for row in cursor.fetchall()}

def calculate_satisfaction_score(preference_rank):
    """Calculate satisfaction score based on preference rank"""
    scores = {1: 3, 2: 2, 3: 1}
    return scores.get(preference_rank, 0)

def optimize_assignments(preferences, capacities):
    """
    Optimize course assignments using a greedy algorithm with randomization for fairness.

    Algorithm:
    1. Create lists of students for each course, organized by preference rank
    2. For each course, prioritize students by their preference rank
    3. When course is full, place remaining students in waitlist
    4. Students who don't get any of their choices get no assignment
    """

    # Organize preferences by course
    course_preferences = defaultdict(lambda: {1: [], 2: [], 3: []})
    student_preferences = defaultdict(list)

    for pref in preferences:
        user_id = pref['user_id']
        course_id = pref['course_id']
        rank = pref['preference_rank']

        course_preferences[course_id][rank].append(user_id)
        student_preferences[user_id].append({
            'course_id': course_id,
            'rank': rank
        })

    # Track assignments and course enrollments
    assignments = {}
    course_enrollments = defaultdict(int)

    # Process each student's preferences
    students = list(student_preferences.keys())
    random.shuffle(students)  # Randomize to be fair

    for user_id in students:
        if user_id in assignments:
            continue

        # Try to assign student based on preferences (1st, 2nd, 3rd)
        user_prefs = sorted(student_preferences[user_id], key=lambda x: x['rank'])

        for pref in user_prefs:
            course_id = pref['course_id']
            rank = pref['rank']
            capacity = capacities.get(course_id, 0)

            # Check if course has space
            if course_enrollments[course_id] < capacity:
                assignments[user_id] = {
                    'course_id': course_id,
                    'assigned_preference': rank
                }
                course_enrollments[course_id] += 1
                break

    return assignments

def save_assignments(conn, term_id, assignments):
    """Save course assignments to database"""
    cursor = conn.cursor()

    # Clear existing assignments for this term
    cursor.execute("DELETE FROM course_assignments WHERE term_id = %s", (term_id,))

    # Insert new assignments
    for user_id, assignment in assignments.items():
        cursor.execute("""
            INSERT INTO course_assignments
            (user_id, course_id, term_id, assigned_preference, assigned_at)
            VALUES (%s, %s, %s, %s, NOW())
        """, (
            user_id,
            assignment['course_id'],
            term_id,
            assignment['assigned_preference']
        ))

    # Update student_selections status
    cursor.execute("""
        UPDATE student_selections ss
        SET status = CASE
            WHEN EXISTS (
                SELECT 1 FROM course_assignments ca
                WHERE ca.user_id = ss.user_id
                AND ca.course_id = ss.course_id
                AND ca.term_id = %s
            ) THEN 'assigned'
            ELSE 'not_assigned'
        END
        WHERE ss.term_id = %s
    """, (term_id, term_id))

    conn.commit()

def calculate_statistics(preferences, assignments, capacities):
    """Calculate and print optimization statistics"""
    total_students = len(set(p['user_id'] for p in preferences))
    total_assigned = len(assignments)

    # Count assignments by preference rank
    rank_counts = defaultdict(int)
    total_satisfaction = 0

    for assignment in assignments.values():
        rank = assignment['assigned_preference']
        rank_counts[rank] += 1
        total_satisfaction += calculate_satisfaction_score(rank)

    max_satisfaction = total_assigned * 3  # If everyone got 1st choice
    satisfaction_rate = (total_satisfaction / max_satisfaction * 100) if max_satisfaction > 0 else 0

    print("\n" + "="*50)
    print("OPTIMIZATION RESULTS")
    print("="*50)
    print(f"Total Students: {total_students}")
    print(f"Students Assigned: {total_assigned}")
    print(f"Students Not Assigned: {total_students - total_assigned}")
    print(f"\nAssignments by Preference:")
    print(f"  1st Choice: {rank_counts[1]} ({rank_counts[1]/total_assigned*100:.1f}%)" if total_assigned > 0 else "  1st Choice: 0")
    print(f"  2nd Choice: {rank_counts[2]} ({rank_counts[2]/total_assigned*100:.1f}%)" if total_assigned > 0 else "  2nd Choice: 0")
    print(f"  3rd Choice: {rank_counts[3]} ({rank_counts[3]/total_assigned*100:.1f}%)" if total_assigned > 0 else "  3rd Choice: 0")
    print(f"\nOverall Satisfaction Score: {satisfaction_rate:.1f}%")
    print("="*50 + "\n")

def main():
    if len(sys.argv) < 2:
        print("Usage: python optimize.py <term_id>")
        sys.exit(1)

    term_id = sys.argv[1]

    print(f"Starting optimization for term {term_id}...")

    try:
        # Connect to database
        conn = connect_db()

        # Get data
        print("Fetching student preferences...")
        preferences = get_student_preferences(conn, term_id)

        if not preferences:
            print("No student preferences found for this term.")
            sys.exit(0)

        print(f"Found {len(preferences)} preferences from {len(set(p['user_id'] for p in preferences))} students")

        print("Fetching course capacities...")
        capacities = get_course_capacities(conn, term_id)
        print(f"Found {len(capacities)} courses")

        # Run optimization
        print("Running optimization algorithm...")
        assignments = optimize_assignments(preferences, capacities)

        # Save results
        print("Saving assignments to database...")
        save_assignments(conn, term_id, assignments)

        # Print statistics
        calculate_statistics(preferences, assignments, capacities)

        conn.close()
        print("Optimization completed successfully!")

    except Exception as e:
        print(f"Error during optimization: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
