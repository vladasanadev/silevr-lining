import React from 'react';

export default function UploadForm() {
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Upload Form</h2>
      <form className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Title"
          className="border border-gray-300 rounded-md p-2"
        />
        <textarea
          placeholder="Description"
          className="border border-gray-300 rounded-md p-2 resize-none"
          rows={4}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
