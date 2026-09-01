import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s — Panel" },
  robots: { index: false, follow: false },
};

/** El panel no se indexa. La estructura visual vive en `(panel)/layout.tsx`,
 * para que la pantalla de acceso quede fuera del marco con navegación. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
