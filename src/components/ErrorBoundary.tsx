import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#0a0a0a] text-white">
          <p className="text-stone-400 mb-4">Something went wrong.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-full bg-[#1DB954] text-black font-medium hover:bg-[#1ed760]"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
