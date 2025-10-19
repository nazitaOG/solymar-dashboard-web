import { Loader2 } from "lucide-react"; // Usamos un ícono de 'lucide'

export function FullPageLoader() {
  return (
    <div className="flex text-black h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Cargando...</p>
      </div>
    </div>
  );
}