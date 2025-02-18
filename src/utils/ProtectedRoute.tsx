import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const isAuthenticated = localStorage.getItem("auth") === "true";

  console.log("Proteção de rota ativa! Usuário autenticado:", isAuthenticated); // 🔍 Debug

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
