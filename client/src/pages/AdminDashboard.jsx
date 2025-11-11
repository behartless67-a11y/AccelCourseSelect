import React, { useState, useEffect, useContext } from 'react';
import { coursesAPI, adminAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import CourseManagement from '../components/CourseManagement';

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [activeTerm, setActiveTerm] = useState(null);
  const [studentSelections, setStudentSelections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'courses'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Get active term
      const termResponse = await coursesAPI.getActiveTerm();
      const term = termResponse.data.term;
      setActiveTerm(term);

      // Get courses
      const coursesResponse = await coursesAPI.getTermCourses(term.id);
      setCourses(coursesResponse.data.courses);

      // Get all student selections
      const selectionsResponse = await adminAPI.getStudentSelections(term.id);
      setStudentSelections(selectionsResponse.data.students);
    } catch (err) {
      console.error('Error loading data:', err);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCourses = async () => {
    if (!uploadFile) {
      alert('Please select a CSV file');
      return;
    }

    try {
      await adminAPI.uploadCourses(activeTerm.id, uploadFile);
      alert('Courses uploaded successfully!');
      setUploadFile(null);
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to upload courses');
    }
  };

  const handleRunOptimization = async () => {
    if (!confirm('Are you sure you want to run the optimization algorithm? This will assign students to courses.')) {
      return;
    }

    try {
      setOptimizing(true);
      await adminAPI.runOptimization(activeTerm.id);
      alert('Optimization completed successfully!');
      await loadData();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background Image */}
      <div className="fixed inset-0 -z-10" style={{
        backgroundImage: 'url(/garrett-hall-sunset.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'grayscale(100%)',
      }}></div>
      <div className="fixed inset-0 bg-white/85 -z-10"></div>

      {/* Header */}
      <header className="bg-uva-navy text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                Admin Dashboard - {activeTerm?.name}
              </h1>
              <p className="text-sm text-gray-300 mt-1">
                Manage courses and student registrations
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-uva-orange hover:bg-uva-orange-light rounded-lg font-semibold transition-colors text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`${
                  activeTab === 'overview'
                    ? 'border-uva-orange text-uva-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Overview & Actions
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`${
                  activeTab === 'courses'
                    ? 'border-uva-orange text-uva-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Course Management
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Admin Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Upload Courses */}
              <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Upload Courses (CSV)
            </h3>
            <div className="space-y-4">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <button
                onClick={handleUploadCourses}
                disabled={!uploadFile}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload Courses
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium">CSV Format:</p>
              <p className="text-xs mt-1">
                group_code, course_code, course_name, course_type, section_number, capacity, schedule, instructor, room
              </p>
            </div>
              </div>

              {/* Run Optimization */}
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Run Assignment Algorithm
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Run the optimization algorithm to assign students to courses based on their preferences.
                  </p>
                  <button
                    onClick={handleRunOptimization}
                    disabled={optimizing}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {optimizing ? 'Running...' : 'Run Optimization'}
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500">Total Students</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {studentSelections.length}
                </div>
              </div>
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500">Total Courses</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {courses.length}
                </div>
              </div>
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500">Total Selections</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {studentSelections.reduce((sum, s) => sum + s.selections.length, 0)}
                </div>
              </div>
              <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-sm font-medium text-gray-500">Complete Selections</div>
                <div className="mt-2 text-3xl font-bold text-gray-900">
                  {studentSelections.filter((s) => s.selections.length === 3).length}
                </div>
              </div>
            </div>

            {/* Student Selections Table */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  Student Course Selections
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        1st Choice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        2nd Choice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        3rd Choice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {studentSelections.map((student) => {
                      const choice1 = student.selections.find((s) => s.preferenceRank === 1);
                      const choice2 = student.selections.find((s) => s.preferenceRank === 2);
                      const choice3 = student.selections.find((s) => s.preferenceRank === 3);

                      return (
                        <tr key={student.userId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {student.lastName}, {student.firstName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {choice1 ? `${choice1.code} - ${choice1.sectionNumber}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {choice2 ? `${choice2.code} - ${choice2.sectionNumber}` : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {choice3 ? `${choice3.code} - ${choice3.sectionNumber}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.selections.length === 3 ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Complete
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Incomplete ({student.selections.length}/3)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Course Management Tab */}
        {activeTab === 'courses' && (
          <CourseManagement
            courses={courses}
            activeTerm={activeTerm}
            onCoursesChange={loadData}
          />
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
