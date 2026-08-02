import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="card-surface max-w-md rounded-xl p-8 text-center shadow-[var(--shadow-elegant)]">
          <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
          <h2 className="mt-4 font-display text-lg font-semibold">Falha ao renderizar este módulo</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-5 rounded-md border border-gold/40 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/10"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }
}
