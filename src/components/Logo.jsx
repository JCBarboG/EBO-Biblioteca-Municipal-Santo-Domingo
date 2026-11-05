// Logo de EBO para la Biblioteca Municipal Santo Domingo (public/logo.svg).
export default function Logo({ size = 32, className }) {
  return <img className={className} src={`${import.meta.env.BASE_URL}logo.svg`} width={size} height={size} alt="" />;
}
