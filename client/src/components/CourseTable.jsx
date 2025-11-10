import React, { useState, useMemo } from 'react';

function CourseTable({ courses, selections, onSelect }) {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [preferenceRank, setPreferenceRank] = useState(1);

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

  const getSelectionRank = (courseId) => {
    const selection = selections.find((s) => s.course_id === courseId);
    return selection?.preference_rank;
  };

  const handleSelectClick = (course) => {
    setSelectedCourse(course);
    // If already selected, use that rank
    const existingRank = getSelectionRank(course.id);
    if (existingRank) {
      setPreferenceRank(existingRank);
    } else {
      // Auto-select next available rank
      const usedRanks = selections.map((s) => s.preference_rank);
      const nextRank = [1, 2, 3].find((r) => !usedRanks.includes(r)) || 1;
      setPreferenceRank(nextRank);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedCourse) {
      onSelect(selectedCourse.id, preferenceRank);
      setSelectedCourse(null);
    }
  };

  const getAvailabilityClass = (seatsRemaining) => {
    if (seatsRemaining <= 0) return 'text-red-600 font-semibold';
    if (seatsRemaining <= 3) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Available Courses
        </h2>
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
                  {group.courses.map((course, idx) => (
                    <tr
                      key={course.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${
                        isSelected(course.id) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {course.code}
                        </div>
                        <div className="text-sm text-gray-500">{course.name}</div>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.current_requests}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getAvailabilityClass(course.seats_remaining)}`}>
                        {course.seats_remaining}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isSelected(course.id) ? (
                          <div className="flex items-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Choice #{getSelectionRank(course.id)}
                            </span>
                            <button
                              onClick={() => handleSelectClick(course)}
                              className="ml-2 text-blue-600 hover:text-blue-800 text-xs"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelectClick(course)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                            disabled={selections.length >= 3}
                          >
                            Select
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Course Preference
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{selectedCourse.code}</strong> - {selectedCourse.name}
              </p>
              <p className="text-sm text-gray-600">
                Section {selectedCourse.section_number} | {selectedCourse.schedule || 'TBA'}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preference Rank
              </label>
              <div className="space-y-2">
                {[1, 2, 3].map((rank) => (
                  <label key={rank} className="flex items-center">
                    <input
                      type="radio"
                      value={rank}
                      checked={preferenceRank === rank}
                      onChange={(e) => setPreferenceRank(parseInt(e.target.value))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-3 text-sm text-gray-700">
                      {rank === 1 ? '1st Choice' : rank === 2 ? '2nd Choice' : '3rd Choice'}
                      {selections.find((s) => s.preference_rank === rank) && (
                        <span className="ml-2 text-xs text-gray-500">
                          (will replace: {selections.find((s) => s.preference_rank === rank)?.code})
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmSelection}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
              <button
                onClick={() => setSelectedCourse(null)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseTable;
