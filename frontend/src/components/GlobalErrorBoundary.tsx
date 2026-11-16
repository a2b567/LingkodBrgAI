import React from 'react';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';
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
 * GlobalErrorBoundary – catches uncaught React render errors, displays
 * transparent diagnosis details, auto-recovers from Vite/build chunk mismatches,
 * and reports exceptions to the backend /dev/report-error endpoint.
 */
export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, reported: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  private isChunkError(error: Error | null): boolean {
    if (!error?.message) return false;
    const msg = error.message.toLowerCase();
    return (
      msg.includes('dynamically imported') ||
      msg.includes('failed to fetch') ||
      msg.includes('chunk') ||
      msg.includes('loading chunk') ||
      msg.includes('loading dynamic import') ||
      msg.includes('chunkloaderror') ||
      msg.includes('load failed') ||
      msg.includes('importing a module script failed') ||
      msg.includes('network error') ||
      msg.includes("reading 'usestate'") ||
      msg.includes("reading 'useref'") ||
      msg.includes("reading 'useeffect'") ||
      msg.includes("reading 'usecontext'")
    );
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    this.reportToBackend(error, errorInfo);

    // Auto-recover once from Vite cache invalidation / chunk mismatch after new deployments
    const isChunkMismatch = this.isChunkError(error);
    const hasAutoRecovered = sessionStorage.getItem('vite_cache_recovered');
    if (isChunkMismatch && !hasAutoRecovered) {
      sessionStorage.setItem('vite_cache_recovered', 'true');
      window.location.reload();
    }
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
      // Silently ignore if offline
    }
  }

  private handleReload = () => {
    sessionStorage.removeItem('chunk_reload');
    sessionStorage.removeItem('vite_cache_recovered');
    window.location.reload();
  };

  private handleHardReset = async () => {
    try {
      sessionStorage.clear();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch {}
    window.location.reload();
  };

  private handleLogoutAndReset = () => {
    try {
      localStorage.removeItem('lingkodbrgai_token');
      localStorage.removeItem('lingkodbrgai_user');
      sessionStorage.clear();
    } catch {}
    window.location.href = '/login';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isChunkMismatch = this.isChunkError(this.state.error);

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 select-none font-sans">
        <div className="max-w-lg w-full bg-slate-900 rounded-3xl border border-rose-800/60 shadow-2xl p-6 sm:p-8 space-y-5 text-center">
          {/* Status Icon */}
          <div className="w-16 h-16 bg-rose-900/40 border border-rose-700/60 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle size={30} className="text-rose-400" />
          </div>

          {/* Heading */}
          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-white tracking-tight">
              {isChunkMismatch ? 'Kailangan ng Browser Refresh' : 'Something went wrong'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              {isChunkMismatch 
                ? 'May bagong update ang system o na-restart ang server. Paki-pindot ang Reload Application sa ibaba upang i-sync ang pinakabagong bersyon.'
                : 'An unexpected error occurred in the application.' + (this.state.reported ? ' The error has been automatically reported to the development team.' : ' Please reload the page.')}
            </p>
          </div>

          {/* Error detail (Expanded by default for full diagnostic transparency) */}
          {this.state.error && (
            <details open className="text-left bg-slate-950 rounded-2xl p-4 border border-slate-800 cursor-pointer">
              <summary className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-2 cursor-pointer select-none">
                Error Diagnostic Details
              </summary>
              <div className="space-y-2 select-text font-mono text-[11px]">
                <p className="text-rose-400 font-bold break-words">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="text-slate-400 overflow-auto max-h-40 whitespace-pre-wrap break-words leading-relaxed text-[10px] bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80">
                    {this.state.error.stack}
                    {this.state.errorInfo?.componentStack && `\n\nComponent Stack:\n${this.state.errorInfo.componentStack}`}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Status badge */}
          {this.state.reported && (
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3.5 py-1.5 rounded-full">
              ✓ Error reported to Dev Console
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-gov-blue-600 hover:bg-gov-blue-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <RefreshCw size={14} />
              Reload Application
            </button>
            <button
              onClick={this.handleHardReset}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 text-xs font-semibold transition-all border border-slate-700 cursor-pointer"
            >
              Clear Cache & Refresh
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <button
              onClick={this.handleLogoutAndReset}
              className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
            >
              <LogOut size={12} />
              Reset Session & Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
}
