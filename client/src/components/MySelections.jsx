import React from 'react';

function MySelections({ selections, onRemove, onRefresh }) {
  // Group selections by group_code and course_type for better organization
  const sortedSelections = [...selections].sort((a, b) => {
    if (a.group_code !== b.group_code) return a.group_code.localeCompare(b.group_code);
    return a.course_type.localeCompare(b.course_type);
  });

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
      <div className="px-6 py-4 bg-blue-600 border-b border-blue-700">
        <h2 className="text-xl font-semibold text-white">
          My Course Selections
        </h2>
      </div>

      <div className="p-6">
        {sortedSelections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-2">No courses selected yet</p>
            <p className="text-sm">Select 6 courses total (1 Section + 1 Discussion from each group)</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedSelections.map((selection) => (
              <div
                key={selection.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 w-32">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selection.group_code} {selection.course_type}
                    </span>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {selection.code} - {selection.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {selection.course_type} {selection.section_number}
                      {selection.schedule && ` | ${selection.schedule}`}
                    </div>
                    {selection.group_code && (
                      <div className="text-xs text-gray-400 mt-1">
                        {selection.group_code} - {selection.group_name}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onRemove(selection.id)}
                  className="ml-4 text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Remove
                </button>
              </div>
            ))}

            {sortedSelections.length < 6 && (
              <div className="text-center py-4 text-sm text-gray-500 bg-yellow-50 rounded-lg border border-yellow-200">
                You have selected {sortedSelections.length} of 6 courses. Select {6 - sortedSelections.length} more.
              </div>
            )}

            {sortedSelections.length === 6 && (
              <div className="text-center py-4 text-sm text-green-700 bg-green-50 rounded-lg border border-green-200">
                ✓ All 6 course selections complete!
              </div>
            )}
          </div>
        )}

        {sortedSelections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Your selections will be processed by the optimization algorithm.
            </p>
            <button
              onClick={onRefresh}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MySelections;
