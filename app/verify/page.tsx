import type { Metadata } from "next";
import Link from "next/link";
import LicenseSearch from "./LicenseSearch";

export const metadata: Metadata = {
  title: "Verificación de Licencias - Supernovatel",
  description: "Verifique la autenticidad y estado de su licencia de Supernovatel ingresando su ID de licencia.",
};

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/verify">
            <img
              src="/web/Logo_Azul.png"
              alt="Supernovatel"
              width={160}
              height={44}
              className="cursor-pointer"
              loading="eager"
            />
          </Link>
          <nav>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Volver al Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
              Verificación de Licencias
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Ingrese el ID de su licencia para consultar quién la posee, qué
              permite y todos los datos asociados.
            </p>
          </div>

          <LicenseSearch />
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Supernovatel. Todos los derechos reservados.</p>
          <p className="mt-1">Esta página es de acceso público y no requiere autenticación.</p>
        </div>
      </footer>
    </div>
  );
}
