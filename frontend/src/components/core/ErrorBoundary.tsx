import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

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
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload(); // Hard reset for the workspace
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-900 border border-red-900/50 rounded-xl shadow-2xl text-center">
                    <div className="bg-red-900/20 p-4 rounded-full mb-6">
                        <AlertTriangle className="text-red-500 w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
                    <p className="text-gray-400 mb-8 max-w-md">
                        The application encountered an unexpected error. This might be due to a malformed algorithm step or a connection issue.
                    </p>
                    <div className="bg-black/40 p-4 rounded-lg mb-8 w-full max-w-lg text-left overflow-auto max-h-40">
                        <code className="text-red-400 text-sm">
                            {this.state.error?.message || 'Unknown Error'}
                        </code>
                    </div>
                    <button
                        onClick={this.handleReset}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                        <RefreshCw size={20} />
                        Reset Workspace
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
