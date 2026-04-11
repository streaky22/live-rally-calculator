import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-800/50 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg max-w-2xl w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong.</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              An unexpected error occurred while loading the application. Please take a screenshot of this error and send it to the developer:
            </p>
            <div className="bg-gray-100 dark:bg-slate-950 p-4 rounded-md overflow-auto text-sm font-mono text-red-800 mb-6 max-h-64">
              {this.state.error?.toString()}
              <br />
              {this.state.error?.stack}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
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
