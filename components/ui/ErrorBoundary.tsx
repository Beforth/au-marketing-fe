
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
            <p className="text-sm text-slate-500 font-mono bg-slate-50 rounded-lg p-3 text-left break-all">
              {this.state.error?.message}
            </p>
            <button
              type="button"
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
