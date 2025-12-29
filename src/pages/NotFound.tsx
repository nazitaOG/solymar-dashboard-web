import { Link, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { Home as HomeIcon, RotateCcw } from "lucide-react";
import { Head } from "@/components/seo/Head";

export default function NotFound() {
  const error = useRouteError();
  const isResp = isRouteErrorResponse(error);

  const status = isResp ? error.status : 404;
  const statusText = isResp ? error.statusText : "Página no encontrada";
  const message =
    !isResp && error instanceof Error
      ? error.message
      : "La ruta que intentaste abrir no existe o fue movida.";

  return (
    <>
      <Head
        title={`${status} - No encontrada`}
        description="La página que buscas no existe."
      />
      <div className="min-h-dvh grid place-items-center bg-[#0f0e14] text-white px-6">
        <div className="text-center max-w-lg">
          <p className="text-7xl font-extrabold tracking-tight mb-2">{status}</p>
          <h1 className="text-2xl font-semibold mb-2">{statusText}</h1>
          <p className="text-white/70 mb-8">{message}</p>

          <div className="flex items-center justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 hover:bg-white/10 transition"
            >
              <HomeIcon className="w-4 h-4" />
              Ir al inicio
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-2 hover:bg-white/10 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Volver atrás
            </button>
          </div>

          <div className="mt-6 text-sm text-white/50">
            También podés ir a <Link to="/login" className="underline">/login</Link> o{" "}
            <Link to="/dashboard" className="underline">/dashboard</Link>.
          </div>
        </div>
      </div>
    </>

  );
}
