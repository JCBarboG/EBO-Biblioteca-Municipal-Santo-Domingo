import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from '../components/Icons';

const CONTENT = {
  es: (
    <>
      <h3>1. Compromiso con la privacidad</h3>
      <p>La privacidad de los usuarios es un principio fundamental de EBO, no una concesión circunstancial. EBO fue diseñado desde su origen para operar sin recopilar, almacenar ni comercializar datos personales de ningún tipo. Este compromiso es permanente e inalienable: ninguna versión futura de la plataforma, sea gratuita o de pago, alterará este principio.</p>

      <h3>2. Datos recopilados en la versión gratuita</h3>
      <p>EBO Free no recopila ningún tipo de dato personal. No existen formularios de registro, no se generan perfiles de usuario y ninguna información bibliográfica procesada abandona el dispositivo del usuario. Todo el procesamiento OCR ocurre íntegramente en el navegador mediante tecnología de código abierto, sin conexión a servidores externos de procesamiento.</p>

      <h3>3. Formulario de soporte</h3>
      <p>El formulario de Soporte y Contacto es el único punto de contacto donde EBO puede recibir datos personales. Cuando un usuario envía un mensaje de soporte, los datos proporcionados —nombre, correo electrónico, descripción del problema e imágenes adjuntas opcionales— se utilizan exclusivamente para responder la consulta específica. Estos datos no se archivan en bases de datos propias, no se comparten con terceros y no se utilizan para ningún fin distinto al de la atención directa de la consulta recibida.</p>

      <h3>4. Registros técnicos automatizados</h3>
      <p>EBO está alojado en GitHub Pages (GitHub Inc.). Como servicio de alojamiento web, GitHub puede generar registros técnicos automáticos que incluyen información como direcciones IP, navegadores utilizados y fechas de acceso. Esta generación de registros es inherente a la infraestructura de GitHub y está fuera del control de EBO. Jean Barboza González no tiene acceso a dichos registros, no los solicita ni los utiliza con ningún fin. Para conocer el tratamiento de estos datos, el usuario puede consultar la política de privacidad de GitHub.</p>

      <h3>5. Cookies y rastreo</h3>
      <p>EBO no utiliza cookies de rastreo, analítica ni publicidad. La única tecnología de almacenamiento local utilizada es localStorage del navegador, empleada exclusivamente para guardar las preferencias del usuario en el dispositivo: idioma seleccionado, preferencia de tema (claro/oscuro) y configuración de cámara. Estos datos permanecen en el dispositivo del usuario y nunca se transmiten a ningún servidor. La única excepción es «Buscar ISBN en línea»: al usarlo, se envía solo el ISBN a Open Library y Google Books.</p>

      <h3>6. Compromiso a futuro</h3>
      <p>En las versiones futuras de EBO, incluyendo la versión Premium actualmente en desarrollo, los principios descritos en esta política serán inalterables. Cualquier funcionalidad que requiera el manejo de datos personales —como el historial en la nube disponible en EBO Premium— será implementada con el consentimiento explícito del usuario, mecanismos de cifrado apropiados y opciones claras de eliminación de datos. La confianza del usuario es el activo más valioso de esta plataforma.</p>

      <p className="legal-footer">Última actualización: julio de 2026 · Jean Barboza González</p>
    </>
  ),
  en: (
    <>
      <h3>1. Privacy commitment</h3>
      <p>User privacy is a fundamental principle of EBO, not a circumstantial concession. EBO was designed from the outset to operate without collecting, storing, or commercializing personal data of any kind. This commitment is permanent and inalienable: no future version of the platform, whether free or paid, will alter this principle.</p>

      <h3>2. Data collected in the free version</h3>
      <p>EBO Free does not collect any personal data. There are no registration forms, no user profiles are created, and no bibliographic information processed ever leaves the user's device. All OCR processing occurs entirely in the browser using open-source technology, without connecting to external processing servers.</p>

      <h3>3. Support form</h3>
      <p>The Support and Contact form is the only point of contact where EBO may receive personal data. When a user sends a support message, the data provided—name, email address, problem description, and optional attached images—is used exclusively to respond to the specific inquiry. This data is not archived in proprietary databases, is not shared with third parties, and is not used for any purpose other than directly addressing the inquiry received.</p>

      <h3>4. Automated technical records</h3>
      <p>EBO is hosted on GitHub Pages (GitHub Inc.). As a web hosting service, GitHub may generate automatic technical records including information such as IP addresses, browsers used, and access dates. This log generation is inherent to GitHub's infrastructure and is outside EBO's control. Jean Barboza González does not have access to such records, does not request them, and does not use them for any purpose. To learn about the handling of this data, users may consult GitHub's privacy policy.</p>

      <h3>5. Cookies and tracking</h3>
      <p>EBO does not use tracking cookies, analytics, or advertising. The only local storage technology used is the browser's localStorage, employed exclusively to save user preferences on the device: selected language, theme preference (light/dark), and camera configuration. This data remains on the user's device and is never transmitted to any server. The only exception is “Look up ISBN online”: when used, only the ISBN is sent to Open Library and Google Books.</p>

      <h3>6. Future commitment</h3>
      <p>In future versions of EBO, including the Premium version currently in development, the principles described in this policy will be unalterable. Any functionality requiring the handling of personal data—such as the cloud history available in EBO Premium—will be implemented with the user's explicit consent, appropriate encryption mechanisms, and clear data deletion options. User trust is the most valuable asset of this platform.</p>

      <p className="legal-footer">Last updated: July 2026 · Jean Barboza González</p>
    </>
  ),
};

export default function PrivacyView({ onBack }) {
  const { lang } = useApp();
  const t = useT(lang);

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}><Icon name="chevronLeft" size={16} strokeWidth={2} /></button>
        <h2>{t.privacy.title}</h2>
      </div>
      <div className="view-body legal-body">
        {CONTENT[lang] || CONTENT.es}
      </div>
    </div>
  );
}
