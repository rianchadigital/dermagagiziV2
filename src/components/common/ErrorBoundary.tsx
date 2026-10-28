import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleHardReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 md:p-10 max-w-2xl mx-auto my-8 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl shadow-lg text-slate-800 dark:text-slate-100">
          <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
            <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-2xl">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {this.props.fallbackTitle || 'Terjadi Kendala Memuat Modul'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Aplikasi DERMAGA GIZI mendeteksi gangguan tampilan data pada halaman ini.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 overflow-x-auto mb-6">
            <span className="font-bold text-rose-600 dark:text-rose-400 block mb-1">Pesan Error:</span>
            {this.state.error?.message || 'Unknown render error'}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Coba Muat Ulang Modul</span>
            </button>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null });
                if (this.props.onReset) this.props.onReset();
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>

            <button
              onClick={this.handleHardReset}
              className="px-4 py-2 border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer ml-auto"
              title="Reset data demo lokal jika data cache browser sebelumnya rusak"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Cache Data</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
