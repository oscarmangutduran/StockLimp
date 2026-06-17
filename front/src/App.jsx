import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ProductManagement from './pages/ProductManagement';
import OrderManagement from './pages/OrderManagement';
import CenterManagement from './pages/CenterManagement';

function App() {
  return (
    // 1. El Router envuelve absolutamente TODO lo que dependa de rutas
    <Router>
      <Routes>
        {/* 2. Ahora Login está DENTRO del contexto, por lo que useNavigate() funcionará perfectamente */}
        <Route path="/" element={<Login />} />

        {/* Rutas protegidas del Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Si entran a /dashboard a secas, redirige directamente a productos */}
          <Route index element={<Navigate to="productos" replace />} />
          
          <Route path="productos" element={<ProductManagement />} />
          <Route path="pedidos" element={<OrderManagement />} />
          <Route path="centros" element={<CenterManagement />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;