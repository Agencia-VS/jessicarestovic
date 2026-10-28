import { metadatosPagina } from "@/lib/metadatos";
import { Pagina, Titulo } from "@/components/site/pagina";
import { BotonPreferencias } from "@/components/site/preferencias";
import { obtenerConfiguracion } from "@/lib/data/consultas";
import { derivarContacto } from "@/lib/site-config";
import { VERSION_PRIVACIDAD } from "@/lib/comercial/tipos";

export const metadata = metadatosPagina({ titulo:"Privacidad", descripcion:"Datos de contacto, preferencias de medición y cómo ejercer tus derechos.", ruta:"/privacidad" });
export default async function PrivacidadPage() {
  const contacto = derivarContacto(await obtenerConfiguracion());
  return <Pagina><div className="mx-auto flex w-full max-w-[65rem] flex-col gap-6 gutter py-12">
    <Titulo>Privacidad</Titulo>
    <div className="flex max-w-[70ch] flex-col gap-5 leading-relaxed">
      <p className="text-sm text-muted">Versión {VERSION_PRIVACIDAD}</p>
      <p>Jessica Restović es responsable de los datos que se recogen en este sitio. Para consultas de privacidad, acceso, rectificación, eliminación, oposición, portabilidad o retiro de una autorización, escribe a <a href={"mailto:" + contacto.email} className="underline">{contacto.email}</a>. Atenderemos tu solicitud y verificaremos tu identidad cuando sea necesario.</p>
      <h2 className="text-xl">Tu consulta por WhatsApp</h2>
      <p>El formulario prepara un mensaje con tu nombre, motivo, obra o exposición de interés y comentario. Al continuar se abre WhatsApp; tú revisas el texto y pulsas Enviar. El sitio no guarda el comentario ni confirma el envío. WhatsApp y Meta tratan los datos que les compartes según sus propias políticas.</p>
      <h2 className="text-xl">Guardar un contacto y recibir novedades</h2>
      <p>Solo si marcas la autorización correspondiente guardamos nombre, correo, motivo e interés en una obra o exposición para dar seguimiento a tu consulta. Registramos también la finalidad, fecha y versión de tu autorización. La opción de recibir novedades por correo es independiente y está desmarcada inicialmente. Puedes usar WhatsApp sin aceptar ninguna de estas opciones.</p>
      <p>Conservamos estos contactos hasta 12 meses desde la última gestión, con depuración diaria. Puedes pedir su eliminación antes. La baja de novedades se realiza desde el enlace que aparece después del registro o escribiendo al correo anterior. La baja detiene las novedades y no impide que respondamos una consulta tuya. Este sitio no envía campañas automáticamente.</p>
      <h2 className="text-xl">Medición opcional</h2>
      <p>La analítica está desactivada hasta que aceptas. Si aceptas, recogemos páginas públicas visitadas, fecha, categoría de procedencia, tipo de dispositivo y acciones de contacto: clics en WhatsApp, correo o Instagram, y registros de contacto. Usamos un identificador aleatorio de sesión que caduca tras 30 minutos de inactividad. No asociamos tu nombre o correo a esa navegación ni guardamos el contenido de mensajes, direcciones completas de procedencia o parámetros de las páginas.</p>
      <p>Estos eventos se conservan hasta 180 días, con depuración diaria. Los resultados ayudan a entender qué contenido interesa. Los clics no confirman mensajes enviados ni ventas y las visitas medidas no representan a todas las personas que entran al sitio.</p>
      <p>Una cookie necesaria recuerda tu elección durante 180 días; la cookie de sesión de analítica solo se usa con aceptación. El almacenamiento del navegador recuerda una negativa para detener la medición incluso si falla la conexión. Puedes cambiar tu elección aquí o en el pie de página. Al retirarla se detiene la medición futura; los eventos anteriores se conservan hasta su vencimiento.</p>
      <BotonPreferencias />
      <h2 className="text-xl">Proveedores y seguridad</h2>
      <p>Vercel aloja el sitio y Supabase almacena los registros y gestiona el acceso al panel. Estos servicios pueden procesar datos fuera de Chile según su configuración. El acceso a contactos y estadísticas está restringido a cuentas autorizadas. No vendemos tus datos ni hacemos perfiles individuales o decisiones automatizadas con efectos sobre ti.</p>
      <p>Para limitar abusos, el servidor utiliza temporalmente un identificador derivado de la dirección de conexión mediante una clave privada; no guarda la dirección IP en los registros de analítica. Los proveedores de infraestructura pueden mantener sus propios registros técnicos. Las cookies de autenticación se usan al entrar al panel de administración.</p>
      <p>Los mensajes recibidos antes del cambio a WhatsApp siguen en un archivo privado para atender las consultas pendientes. Su revisión y eliminación se gestionan por el mismo correo de privacidad.</p>
    </div>
  </div></Pagina>;
}
