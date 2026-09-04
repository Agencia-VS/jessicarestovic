import type { Metadata } from "next";
import { FormularioLogin } from "@/components/admin/formulario-login";
import { Firma } from "@/components/site/firma";

export const metadata: Metadata = {
  title: "Entrar al panel",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const { volver } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-paper px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-10">
        <div className="flex flex-col gap-2">
          <Firma lugar="panel" />
          <p className="caption text-muted">Panel para administrar el sitio</p>
        </div>

        <FormularioLogin volver={volver ?? ""} />
      </div>
    </main>
  );
}
