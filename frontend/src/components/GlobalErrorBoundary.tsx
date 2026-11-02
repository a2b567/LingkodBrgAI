import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../services/api';


interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  reported: boolean;
}

/**
 * GlobalErrorBoundary – catches uncaught React render errors and
 * reports them to the backend /dev/report-error endpoint so the
 * Developer can see them in the Dev Console Error Logs tab.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, reported: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.reportToBackend(error, errorInfo);
  }

  private async reportToBackend(error: Error, errorInfo: React.ErrorInfo) {
    try {
      await api.dev.reportError({
        message: error.message || 'Unknown React render error',
        stack: (error.stack || '') + '\n\nComponent Stack:\n' + (errorInfo.componentStack || ''),
        path: window.location.pathname,
        user_agent: navigator.userAgent,
      });
      this.setState({ reported: true });
    } catch {
      // silently ignore if backend is down
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-slate-900 rounded-3xl border border-rose-800/60 shadow-2xl p-8 space-y-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-rose-900/50 border border-rose-700/60 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle size={28} className="text-rose-400" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl font-black text-white">Something went wrong</h1>
            <p className="text-sm text-slate-400">
              An unexpected error occurred in the application.
              {this.state.reported
                ? ' The error has been automatically reported to the development team.'
                : ' Please reload the page.'}
            </p>
          </div>

          {/* Error detail (collapsed) */}
          {this.state.error && (
            <details className="text-left bg-slate-950 rounded-xl p-4 border border-slate-800 cursor-pointer">
              <summary className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 cursor-pointer">
                Error Details
              </summary>
              <pre className="text-[11px] text-slate-400 overflow-auto max-h-40 whitespace-pre-wrap break-words">
                {this.state.error.message}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          {/* Status badge */}
          {this.state.reported && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-full">
              ✓ Error reported to Dev Console
            </div>
          )}

          {/* Reload button */}
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 mx-auto px-6 py-3 rounded-2xl bg-gov-blue-600 hover:bg-gov-blue-700 text-white text-sm font-bold transition-colors cursor-pointer"
          >
            <RefreshCw size={15} />
            Reload Application
          </button>
        </div>
      </div>
    );
  }
}
