import React, { useState, useEffect, useContext } from 'react';
import { coursesAPI, selectionsAPI } from '../services/api';
import socketService from '../services/socket';
import { AuthContext } from '../context/AuthContext';
import CourseTable from '../components/CourseTable';
import MySelections from '../components/MySelections';

function StudentDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [activeTerm, setActiveTerm] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();

    return () => {
      if (activeTerm) {
        socketService.leaveTerm(activeTerm.id);
      }
    };
  }, []);

  useEffect(() => {
    if (activeTerm) {
      socketService.joinTerm(activeTerm.id);

      // Listen for real-time course updates
      socketService.onCourseUpdated((updatedCourse) => {
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course.id === updatedCourse.id
              ? { ...course, ...updatedCourse }
              : course
          )
        );
      });

      return () => {
        socketService.off('course_updated');
      };
    }
  }, [activeTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get active term
      const termResponse = await coursesAPI.getActiveTerm();
      const term = termResponse.data.term;
      setActiveTerm(term);

      // Get courses for the term
      const coursesResponse = await coursesAPI.getTermCourses(term.id);
      setCourses(coursesResponse.data.courses);

      // Get user's selections
      const selectionsResponse = await selectionsAPI.getSelections(term.id);
      setSelections(selectionsResponse.data.selections);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = async (courseId, preferenceRank) => {
    try {
      await selectionsAPI.selectCourse(courseId, activeTerm.id, preferenceRank);
      await loadData(); // Reload to get updated data
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to select course');
    }
  };

  const handleRemoveSelection = async (selectionId) => {
    try {
      await selectionsAPI.removeSelection(selectionId);
      await loadData(); // Reload to get updated data
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to remove selection');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
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
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Accelerated Course Selection</h1>
              <p className="text-sm text-gray-300 mt-1">
                {activeTerm?.name} | Frank Batten School
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-300">Student</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-uva-orange hover:bg-uva-orange-light rounded-lg font-semibold transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Instructions */}
        <div className="bg-uva-orange/10 border-l-4 border-uva-orange p-4 mb-6 rounded-r">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-uva-navy font-serif">
                Course Selection Instructions
              </h3>
              <div className="mt-2 text-sm text-uva-navy">
                <p>
                  Select your 1st, 2nd, and 3rd choice courses from the list below.
                  The system will show real-time seat availability. Your selections
                  will be processed using an optimization algorithm to maximize
                  student satisfaction while respecting course capacities.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* My Selections */}
        <MySelections
          selections={selections}
          onRemove={handleRemoveSelection}
          onRefresh={loadData}
        />

        {/* Course Table */}
        <CourseTable
          courses={courses}
          selections={selections}
          onSelect={handleSelectCourse}
        />
      </main>
    </div>
  );
}

export default StudentDashboard;
