
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

/** A single line, flowing cleanly, then breaking. The one visual idea, kept minimal. */
const BrokenLine: React.FC = () => (
  <svg viewBox="0 0 200 40" className="w-40 h-8" role="img" aria-label="A line breaking apart">
    <path d="M 4 20 C 40 20, 55 8, 85 8" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="97" cy="8" r="4.5" fill="#fb7185">
      <animate attributeName="opacity" values="1;0.4;1" dur="1.8s" repeatCount="indefinite" />
    </circle>
    <path d="M 109 10 C 130 14, 150 26, 196 26" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="0.5 6" strokeLinecap="round" />
  </svg>
);

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, copied: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleCopy = () => {
    const text = this.state.error?.stack || this.state.error?.message || 'Unknown error';
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: 'var(--background, #f8fafc)' }}>
          <div className="max-w-sm w-full text-center">
            <div className="flex justify-center mb-6">
              <BrokenLine />
            </div>

            <h1 className="text-xl font-bold text-slate-900 mb-2">Something broke along the way</h1>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Reloading usually clears it. If it keeps happening, this detail is worth sharing.
            </p>

            <p className="text-xs text-slate-600 font-mono bg-white border border-slate-200 rounded-lg p-3 break-all max-h-24 overflow-y-auto text-left mb-6">
              {this.state.error?.message || 'Unknown error'}
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
              >
                <RotateCcw size={15} />
                Reload
              </button>
              <button
                type="button"
                onClick={this.handleCopy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {this.state.copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
                {this.state.copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
