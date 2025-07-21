import React, { Component, ReactNode } from 'react';
import { clearAllAppData } from '@/utils/localStorage';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App crashed:', error, errorInfo);
  }

  handleResetApp = () => {
    // Clear all stored data
    clearAllAppData();
    
    // Reset error state
    this.setState({ hasError: false, error: null });
    
    // Reload the page to start fresh
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-red-600 mb-2">
                🚨 Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                The app encountered an unexpected error. This might be due to corrupted data or a temporary issue.
              </p>
              {this.state.error && (
                <details className="text-xs text-gray-500 mb-4 p-2 bg-gray-50 rounded">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
                </details>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleResetApp}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Reset App & Start Fresh
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 transition-colors"
              >
                Try Refreshing Page
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-4">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary; 