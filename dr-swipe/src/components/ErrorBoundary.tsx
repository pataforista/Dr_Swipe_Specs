import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
  errorStack?: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message,
      errorStack: error.stack
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
          <div className="max-w-md w-full mx-4 p-8 bg-slate-900 border border-red-500/50 rounded-lg text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-black text-red-400 mb-4">Error de Aplicación</h1>
            <p className="text-slate-300 mb-6 text-sm">
              {this.state.errorMessage || "Algo salió mal. Por favor, intenta recargar la página."}
            </p>
            {import.meta.env.DEV && this.state.errorStack && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400">
                  Detalles técnicos
                </summary>
                <pre className="mt-2 text-xs bg-black/50 p-3 rounded overflow-auto max-h-40 text-slate-400">
                  {this.state.errorStack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReload}
              className="w-full bg-medical-primary hover:bg-medical-primary/80 text-white font-black py-3 rounded-lg transition-colors"
            >
              Recargar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
