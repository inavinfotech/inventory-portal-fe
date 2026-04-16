import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Movements from "./pages/Movements";
import Reservations from "./pages/Reservations";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter basename="/inventory">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/movements" element={<Movements />} />
                  <Route path="/reservations" element={<Reservations />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Route>
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
