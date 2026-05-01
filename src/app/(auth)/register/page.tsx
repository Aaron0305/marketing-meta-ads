import RegisterForm from "@/components/auth/register-form";

export const metadata = {
  title: "Crear Cuenta — WTII Marketing",
  description: "Regístrate en el panel de marketing de What Time Is It? Idiomas",
};

export default function RegisterPage() {
  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden p-6">
      {/* Fondo gradiente oscuro (Reutilizado del login) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0f0c29] via-[#1a0a3e] to-[#24243e]">
        {/* Orbes animados */}
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,#7c3aed_0%,transparent_70%)] blur-[80px] opacity-50 animate-orb" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,#f59e0b_0%,transparent_70%)] blur-[80px] opacity-50 animate-orb-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,#06b6d4_0%,transparent_70%)] blur-[80px] opacity-30 animate-orb-slow" />
      </div>

      {/* Card de registro */}
      <RegisterForm />
    </div>
  );
}
