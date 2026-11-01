import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout, RequirePermission } from './components/layout/AppLayout.jsx';
import { PageSkeleton } from './components/ui/index.js';
import { useDemo } from './context/DemoContext.jsx';
import DemoAccessPage from './pages/DemoAccessPage.jsx';

const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage.jsx'));
const EmployeeProfilePage = lazy(() => import('./pages/EmployeeProfilePage.jsx'));
const CompetencyMatrixPage = lazy(() => import('./pages/CompetencyMatrixPage.jsx'));
const SkillGapsPage = lazy(() => import('./pages/SkillGapsPage.jsx'));
const TrainingCataloguePage = lazy(() => import('./pages/TrainingCataloguePage.jsx'));
const AssignmentsPage = lazy(() => import('./pages/AssignmentsPage.jsx'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage.jsx'));
const CareerPathsPage = lazy(() => import('./pages/CareerPathsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function HomeRedirect() {
  const { session } = useDemo();
  return <Navigate to={session ? '/dashboard' : '/demo-access'} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/demo-access" element={<DemoAccessPage />} />
        <Route path="/login" element={<Navigate to="/demo-access" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route
            path="/employees"
            element={
              <RequirePermission permission="employees.view">
                <EmployeesPage />
              </RequirePermission>
            }
          />
          <Route path="/employees/:id" element={<EmployeeProfilePage />} />
          <Route path="/skills" element={<CompetencyMatrixPage />} />
          <Route path="/skills/gaps" element={<SkillGapsPage />} />
          <Route path="/training" element={<TrainingCataloguePage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
          <Route
            path="/analytics"
            element={
              <RequirePermission permission="analytics.view">
                <AnalyticsPage />
              </RequirePermission>
            }
          />
          <Route path="/career-paths" element={<CareerPathsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
