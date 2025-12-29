interface HeadProps {
  title: string;
  description?: string;
}

export function Head({ title, description }: HeadProps) {
  return (
    <>
      {/* 1. Título Dinámico */}
      <title>{`${title} | Solymar Viajes`}</title>
      
      {/* 2. Descripción Dinámica (Opcional) */}
      {description && <meta name="description" content={description} />}
      
      {/* 3. Open Graph Dinámico (Para que al compartir cambie el título) */}
      <meta property="og:title" content={`${title} | Solymar Viajes`} />
      {description && <meta property="og:description" content={description} />}
    </>
  );
}