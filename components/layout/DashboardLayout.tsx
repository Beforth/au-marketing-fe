
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../ui/Sidebar';
import { Navbar } from '../ui/Navbar';
import { useApp } from '../../App';
import { Toast } from '../ui/Toast';

export const DashboardLayout: React.FC = () => {
  const { toast, onCloseToast } = useApp();

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen">
        <Navbar />

        <div
          className="ml-60 max-w-[1600px] flex-1 transition-all duration-300"
          style={{ padding: 'calc(var(--ui-padding) * 2) var(--ui-padding) var(--ui-padding)' }}
        >
          <Outlet />
        </div>
      </main>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={onCloseToast}
        />
      )}
    </div>
  );
};
