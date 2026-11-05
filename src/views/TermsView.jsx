import { useApp } from '../context/AppContext';
import { useT } from '../i18n/translations';
import Icon from '../components/Icons';

const CONTENT = {
  es: (
    <>
      <h3>1. Naturaleza del servicio</h3>
      <p>EBO es una aplicación web progresiva (PWA) diseñada para facilitar la catalogación de materiales bibliográficos. El servicio se presta de forma gratuita, sin garantías de disponibilidad continua, y puede evolucionar, actualizarse o modificarse en cualquier momento. EBO opera íntegramente en el navegador del usuario, sin servidores propios que almacenen información personal.</p>

      <h3>2. Uso aceptable</h3>
      <p>El usuario se compromete a utilizar EBO únicamente para fines legítimos relacionados con la gestión bibliográfica. Queda prohibido el uso de la plataforma para actividades ilícitas, la reproducción masiva de contenido protegido por derechos de autor, o cualquier acción que pueda comprometer la integridad del servicio o de otros usuarios. El acceso a EBO implica la aceptación de estos términos.</p>

      <h3>3. Datos e información del usuario</h3>
      <p>EBO no requiere registro de usuarios ni recopila datos personales de forma activa. Toda la información bibliográfica procesada reside exclusivamente en el dispositivo del usuario durante la sesión y no se transmite a ningún servidor externo, salvo cuando el usuario decide enviar un mensaje de soporte a través del formulario correspondiente. En ese caso, los datos proporcionados —nombre, correo electrónico y descripción del problema— se utilizan exclusivamente para responder la consulta y no se archivan, comparten ni utilizan con ningún otro fin.</p>

      <h3>4. Registros técnicos</h3>
      <p>EBO está alojado en GitHub Pages, un servicio de GitHub Inc. Como es habitual en cualquier servicio de alojamiento web, GitHub puede registrar técnicamente ciertas información de acceso, incluyendo direcciones IP, como parte de su operación ordinaria. EBO no tiene acceso a estos registros, no los solicita, no los analiza y no los utiliza para ningún propósito. Estos registros son competencia exclusiva de GitHub según sus propias políticas de privacidad.</p>

      <h3>5. Plataforma en desarrollo</h3>
      <p>EBO es una plataforma en evolución activa. Las funcionalidades disponibles pueden cambiar, ampliarse o modificarse en versiones futuras sin previo aviso. Sin embargo, los principios fundamentales de privacidad y tratamiento de datos descritos en estos términos son permanentes y no serán alterados en versiones futuras de la plataforma, independientemente de las mejoras técnicas que se incorporen.</p>

      <h3>6. Responsabilidad</h3>
      <p>EBO se provee "tal como está" sin garantías expresas ni implícitas. Jean Barboza González no asume responsabilidad por pérdidas de datos, interrupciones del servicio, errores en el procesamiento OCR, ni por el uso que el usuario haga de la información generada por la plataforma. El usuario es responsable de verificar la exactitud de los datos bibliográficos obtenidos y de su uso conforme a la normativa aplicable en su jurisdicción.</p>

      <p className="legal-footer">Última actualización: julio de 2026 · Jean Barboza González</p>
    </>
  ),
  en: (
    <>
      <h3>1. Nature of the service</h3>
      <p>EBO is a progressive web application (PWA) designed to facilitate the cataloging of bibliographic materials. The service is provided free of charge, without guarantees of continuous availability, and may evolve, be updated, or modified at any time. EBO operates entirely in the user's browser, with no proprietary servers that store personal information.</p>

      <h3>2. Acceptable use</h3>
      <p>Users agree to use EBO solely for legitimate purposes related to bibliographic management. The use of the platform for illegal activities, mass reproduction of copyrighted content, or any action that could compromise the integrity of the service or other users is prohibited. Access to EBO implies acceptance of these terms.</p>

      <h3>3. User data and information</h3>
      <p>EBO does not require user registration and does not actively collect personal data. All bibliographic information processed resides exclusively on the user's device during the session and is not transmitted to any external server, except when the user chooses to send a support message through the corresponding form. In that case, the data provided—name, email address, and problem description—is used exclusively to respond to the inquiry and is not archived, shared, or used for any other purpose.</p>

      <h3>4. Technical records</h3>
      <p>EBO is hosted on GitHub Pages, a service by GitHub Inc. As is common with any web hosting service, GitHub may technically record certain access information, including IP addresses, as part of its ordinary operation. EBO has no access to these records, does not request them, does not analyze them, and does not use them for any purpose. These records are exclusively GitHub's responsibility under their own privacy policies.</p>

      <h3>5. Platform in development</h3>
      <p>EBO is an actively evolving platform. Available features may change, expand, or be modified in future versions without prior notice. However, the fundamental principles of privacy and data handling described in these terms are permanent and will not be altered in future versions of the platform, regardless of technical improvements that may be incorporated.</p>

      <h3>6. Liability</h3>
      <p>EBO is provided "as is" without express or implied warranties. Jean Barboza González assumes no liability for data loss, service interruptions, OCR processing errors, or the user's use of information generated by the platform. The user is responsible for verifying the accuracy of bibliographic data obtained and for its use in accordance with applicable regulations in their jurisdiction.</p>

      <p className="legal-footer">Last updated: July 2026 · Jean Barboza González</p>
    </>
  ),
};

export default function TermsView({ onBack }) {
  const { lang } = useApp();
  const t = useT(lang);

  return (
    <div className="view">
      <div className="view-header">
        <button type="button" className="view-back" onClick={onBack} aria-label={t.ui.back}><Icon name="chevronLeft" size={16} strokeWidth={2} /></button>
        <h2>{t.terms.title}</h2>
      </div>
      <div className="view-body legal-body">
        {CONTENT[lang] || CONTENT.es}
      </div>
    </div>
  );
}
