import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Dashboard, CreateTest, TestDetail } from '@/pages';

const Router: React.FC = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/tests/new" element={<CreateTest />} />
    <Route path="/tests/:id" element={<TestDetail />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default Router;
