import React from 'react';
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="flex gap-4 p-4 bg-gray-100">
      <Link href="/">Home</Link>
      <Link href="/user-dashboard">User Dashboard</Link>
      {/* Add other navigation links here */}
    </nav>
  );
}
