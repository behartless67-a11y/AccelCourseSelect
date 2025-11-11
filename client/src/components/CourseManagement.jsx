import React, { useState } from 'react';
import { adminAPI } from '../services/api';

function CourseManagement({ courses, activeTerm, onCoursesChange }) {
  const [editingCourse, setEditingCourse] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formData, setFormData] = useState({
    groupCode: '',
    code: '',
    name: '',
    courseType: 'Section',
    sectionNumber: '',
    capacity: '',
    schedule: '',
    instructor: '',
    room: '',
  });

  const resetForm = () => {
    setFormData({
      groupCode: '',
      code: '',
      name: '',
      courseType: 'Section',
      sectionNumber: '',
      capacity: '',
      schedule: '',
      instructor: '',
      room: '',
    });
    setEditingCourse(null);
    setIsAddingNew(false);
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setIsAddingNew(false);
    setFormData({
      groupCode: course.group_code || '',
      code: course.code || '',
      name: course.name || '',
      courseType: course.course_type || 'Section',
      sectionNumber: course.section_number || '',
      capacity: course.capacity || '',
      schedule: course.schedule || '',
      instructor: course.instructor || '',
      room: course.room || '',
    });
  };

  const handleAddNew = () => {
    resetForm();
    setIsAddingNew(true);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingCourse) {
        // Update existing course
        await adminAPI.updateCourse(editingCourse.id, {
          ...formData,
          capacity: parseInt(formData.capacity),
        });
        alert('Course updated successfully!');
      } else {
        // Create new course
        await adminAPI.createCourse({
          termId: activeTerm.id,
          ...formData,
          capacity: parseInt(formData.capacity),
        });
        alert('Course added successfully!');
      }

      resetForm();
      onCoursesChange(); // Reload courses
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to save course');
    }
  };

  const handleDelete = async (courseId, courseName) => {
    if (!confirm(`Are you sure you want to delete "${courseName}"? This will also remove all student selections for this course.`)) {
      return;
    }

    try {
      await adminAPI.deleteCourse(courseId);
      alert('Course deleted successfully!');
      onCoursesChange(); // Reload courses
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to delete course');
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Course Management
        </h2>
        {!isAddingNew && !editingCourse && (
          <button
            onClick={handleAddNew}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold"
          >
            + Add New Course
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {(isAddingNew || editingCourse) && (
        <div className="bg-blue-50 border-b border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Code *
                </label>
                <select
                  name="groupCode"
                  value={formData.groupCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Group</option>
                  <option value="ECON">ECON</option>
                  <option value="RMDA">RMDA</option>
                  <option value="POLICY">POLICY</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  required
                  placeholder="e.g., ECON 3720"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Microeconomics"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Type *
                </label>
                <select
                  name="courseType"
                  value={formData.courseType}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Section">Section</option>
                  <option value="Discussion">Discussion</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section Number
                </label>
                <input
                  type="text"
                  name="sectionNumber"
                  value={formData.sectionNumber}
                  onChange={handleChange}
                  placeholder="e.g., 001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="e.g., 30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule
                </label>
                <input
                  type="text"
                  name="schedule"
                  value={formData.schedule}
                  onChange={handleChange}
                  placeholder="e.g., MWF 10:00-11:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructor
                </label>
                <input
                  type="text"
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  placeholder="e.g., Prof. Smith"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room
                </label>
                <input
                  type="text"
                  name="room"
                  value={formData.room}
                  onChange={handleChange}
                  placeholder="e.g., Garrett 125"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                {editingCourse ? 'Update Course' : 'Add Course'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Course List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Group
              </th>
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
                Capacity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Schedule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Instructor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course, idx) => (
              <tr key={course.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {course.group_code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium">{course.code}</div>
                  <div className="text-gray-500 text-xs">{course.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course.course_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course.section_number || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {course.capacity}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {course.schedule || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {course.instructor || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {course.room || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(course)}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id, course.code)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CourseManagement;
