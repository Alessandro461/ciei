import { Navigate, Outlet } from 'react-router-dom';

interface RoleGuardProps {
  rolPermitido: string; // Ahora podrá recibir "admin,presidente,revisor"
}

export default function RoleGuard({ rolPermitido }: RoleGuardProps) {
  const userStr = localStorage.getItem('usuario');
  
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  const usuario = JSON.parse(userStr);
  const rolesAceptados = rolPermitido.split(','); // Convertimos el texto en una lista

  // Si el rol del usuario NO está en la lista de permitidos, lo rebotamos
  if (!rolesAceptados.includes(usuario.rol)) {
    if (['admin', 'presidente', 'secretario', 'revisor'].includes(usuario.rol)) {
      return <Navigate to="/comite" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}