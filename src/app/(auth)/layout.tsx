/**
 * Auth Layout
 *
 * Layout minimalista para las páginas de autenticación (login, registro, etc.)
 * No incluye sidebar ni navegación del dashboard.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
