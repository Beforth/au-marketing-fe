
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../ui/Sidebar';
import Navbar from '../ui/Navbar';
import { useApp } from '../../App';
import { Toast } from '../ui/Toast';

export const DashboardLayout: React.FC = () => {
  const { toast, onCloseToast } = useApp();

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-indigo-600 selection:text-white">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen min-w-0 bg-[#f8fafc]">
        <Navbar />

        <div
          className="ml-60 flex-1 min-w-0 overflow-x-auto px-16 transition-all duration-500 relative"
          style={{ paddingTop: 'calc(var(--ui-padding) * 2.5)', paddingBottom: 'var(--ui-padding)' }}
        >
          {/* Subtle grid pattern for active work look */}
          <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none -z-10" />
          
          <Outlet />
        </div>
      </main>

    </div>
  );
};
