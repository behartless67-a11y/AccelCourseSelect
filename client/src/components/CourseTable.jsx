import React, { useState, useMemo, useEffect } from 'react';
import LiveIndicator from './LiveIndicator';

function CourseTable({ courses, selections, onSelect }) {
  const [updatedCourses, setUpdatedCourses] = useState(new Set());

  // Track when courses are updated
  useEffect(() => {
    const previousCourses = new Map();
    courses.forEach(c => {
      const key = c.id;
      if (previousCourses.has(key)) {
        const prev = previousCourses.get(key);
        if (prev.seats_remaining !== c.seats_remaining) {
          setUpdatedCourses(prev => new Set([...prev, key]));
          setTimeout(() => {
            setUpdatedCourses(prev => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }, 3000);
        }
      }
      previousCourses.set(key, c);
    });
  }, [courses]);

  // Group courses by group code
  const groupedCourses = useMemo(() => {
    const groups = {};
    courses.forEach((course) => {
      const groupCode = course.group_code || 'OTHER';
      if (!groups[groupCode]) {
        groups[groupCode] = {
          code: groupCode,
          name: course.group_name || groupCode,
          courses: [],
        };
      }
      groups[groupCode].courses.push(course);
    });
    return Object.values(groups);
  }, [courses]);

  const isSelected = (courseId) => {
    return selections.some((s) => s.course_id === courseId);
  };

  const getSelectedForGroup = (groupCode, courseType) => {
    const selected = selections.find(s => {
      const course = courses.find(c => c.id === s.course_id);
      return course && course.group_code === groupCode && course.course_type === courseType;
    });
    return selected?.course_id;
  };

  const handleCourseSelect = (course) => {
    // When selecting a course, it will replace any existing selection in that group/type
    onSelect(course.id, 1); // Pass 1 as a dummy preference rank since we're not using it
  };

  const getAvailabilityClass = (seatsRemaining, capacity) => {
    if (seatsRemaining <= 0) return 'text-red-600 font-semibold bg-red-50';
    const percentFull = ((capacity - seatsRemaining) / capacity) * 100;
    if (percentFull >= 90) return 'text-orange-600 font-semibold bg-orange-50';
    if (percentFull >= 75) return 'text-yellow-600 font-semibold bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getAvailabilityBadge = (seatsRemaining, capacity) => {
    if (seatsRemaining <= 0) return { text: 'FULL', color: 'bg-red-500' };
    const percentFull = ((capacity - seatsRemaining) / capacity) * 100;
    if (percentFull >= 90) return { text: 'FILLING FAST', color: 'bg-orange-500' };
    if (percentFull >= 75) return { text: 'FILLING', color: 'bg-yellow-500' };
    return { text: 'AVAILABLE', color: 'bg-green-500' };
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Available Courses
        </h2>
        <LiveIndicator />
      </div>

      <div className="overflow-x-auto">
        {groupedCourses.map((group) => (
          <div key={group.code} className="border-b border-gray-200 last:border-b-0">
            {/* Group Header */}
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                {group.code} - {group.name}
              </h3>
            </div>

            {/* Courses Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requests
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Remaining
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {group.courses.map((course, idx) => {
                    const badge = getAvailabilityBadge(course.seats_remaining, course.capacity);
                    const justUpdated = updatedCourses.has(course.id);

                    return (
                    <tr
                      key={course.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                        isSelected(course.id) ? 'bg-blue-50' : ''
                      } ${justUpdated ? 'animate-pulse' : ''} transition-all duration-300`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {course.code}
                            </div>
                            <div className="text-sm text-gray-500">{course.name}</div>
                          </div>
                          {justUpdated && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-yellow-200 text-yellow-800 animate-pulse">
                              JUST UPDATED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.course_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {course.section_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {course.schedule || 'TBA'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.capacity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">{course.current_requests}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${badge.color}`}>
                            {badge.text}
                          </span>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap`}>
                        <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-bold ${getAvailabilityClass(course.seats_remaining, course.capacity)}`}>
                          {course.seats_remaining} left
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <input
                          type="radio"
                          name={`${course.group_code}-${course.course_type}`}
                          checked={isSelected(course.id)}
                          onChange={() => handleCourseSelect(course)}
                          className="h-4 w-4 text-uva-orange focus:ring-uva-orange border-gray-300 cursor-pointer"
                        />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseTable;
