"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-brand-bg text-brand-text">
          <p className="font-display font-bold text-lg">Something went wrong</p>
          <pre className="font-mono text-sm text-brand-muted max-w-2xl overflow-auto p-4 rounded bg-brand-surface border border-brand-border">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
