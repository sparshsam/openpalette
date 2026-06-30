"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.name ? `:${this.props.name}` : ""}]`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-10 text-center space-y-3">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm font-semibold text-page">
            {this.props.name ?? "This section"} encountered an error.
          </p>
          <p className="text-xs text-secondary max-w-xs mx-auto">
            Something went wrong while rendering. This is likely a temporary issue.
          </p>
          <button
            className="rounded-full bg-[var(--accent)] text-white px-5 py-2 text-xs font-semibold hover:brightness-110 transition bounce-press"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
