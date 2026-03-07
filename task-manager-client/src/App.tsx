import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useTheme } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tickets from './pages/Tickets';
import TicketDetail from './pages/TicketDetail';
import KanbanBoard from './pages/KanbanBoard';
import Epics from './pages/Epics';
import EpicDetail from './pages/EpicDetail';
import Sprints from './pages/Sprints';
import SprintBoard from './pages/SprintBoard';
import Timeline from './pages/Timeline';
import Departments from './pages/Departments';
import Users from './pages/Users';
import Profile from './pages/Profile';
import TeamPerformance from './pages/TeamPerformance';
import UserPerformance from './pages/UserPerformance';
import PublicSlideshow from './pages/PublicSlideshow';

// Maintenance Management System
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import WorkOrders from './pages/WorkOrders';
import WorkOrderDetail from './pages/WorkOrderDetail';
import DowntimeTracker from './pages/DowntimeTracker';
import MaintenanceCalendar from './pages/MaintenanceCalendar';
import MaintenanceKPI from './pages/MaintenanceKPI';
import ProductionSchedule from './pages/ProductionSchedule';
import ProductionDowntime from './pages/ProductionDowntime';
import ProductionKPI from './pages/ProductionKPI';
import ShiftSettings from './pages/ShiftSettings';
import FailureCodes from './pages/FailureCodes';
import DowntimeClassifications from './pages/DowntimeClassifications';
import DowntimeNewPage from './pages/DowntimeNewPage';
import DowntimeEnd from './pages/DowntimeEnd';
import AISettings from './pages/AISettings';
import SolarDashboard from './pages/SolarDashboard';
import ReportGeneratorPage from './pages/AIReports/ReportGeneratorPage';
import ProductionReportPage from './pages/AIReports/ProductionReportPage';
import AIAdminPage from './pages/admin/AIAdminPage';

// SPK Production Order System
import SPKList from './pages/SPK/SPKList';
import SPKForm from './pages/SPK/SPKForm';
import SPKDetail from './pages/SPK/SPKDetail';
import ProductList from './pages/Products/ProductList';
import SparepartList from './pages/Spareparts/SparepartList';

// Incoming Material Inspection
import InspectionList from './pages/IncomingInspection/InspectionList';
import InspectionForm from './pages/IncomingInspection/InspectionForm';
import InspectionDetail from './pages/IncomingInspection/InspectionDetail';
import { NewComplaintPage } from './pages/IncomingInspection/NewComplaintPage';
import { ComplaintDetailPage } from './pages/IncomingInspection/ComplaintDetailPage'; // New Import
import MachineParameterPage from './pages/MachineParameterPage';

// Digital Signage System
import TemplateList from './pages/DigitalSignage/TemplateList';
import TemplateForm from './pages/DigitalSignage/TemplateForm';
import PlaylistList from './pages/DigitalSignage/PlaylistList';
import PlaylistForm from './pages/DigitalSignage/PlaylistForm';
import SlideList from './pages/DigitalSignage/SlideList';
import SlideForm from './pages/DigitalSignage/SlideForm';
import PlaylistSchedule from './pages/DigitalSignage/PlaylistSchedule';

const LoadingSpinner = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors
      ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Loading...</p>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return user ? <>{children}</> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return !user ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <Routes>
      <Route
        path="/slideshow"
        element={<PublicSlideshow />}
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="board" element={<KanbanBoard />} />
        <Route path="epics" element={<Epics />} />
        <Route path="epics/:id" element={<EpicDetail />} />
        <Route path="sprints" element={<Sprints />} />
        <Route path="sprints/:id" element={<SprintBoard />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="performance" element={<TeamPerformance />} />
        <Route path="performance/:id" element={<UserPerformance />} />
        <Route path="departments" element={<Departments />} />
        <Route path="users" element={<Users />} />
        <Route path="profile" element={<Profile />} />

        {/* Maintenance Management System Routes */}
        <Route path="assets" element={<Assets />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="work-orders" element={<WorkOrders />} />
        <Route path="work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="downtime-tracker" element={<DowntimeTracker />} />
        <Route path="downtime/logs" element={<DowntimeTracker />} />
        <Route path="downtime/history" element={<DowntimeTracker />} />
        <Route path="downtime/new" element={<DowntimeNewPage />} />
        <Route path="downtime/end/:id" element={<DowntimeEnd />} />
        <Route path="maintenance-calendar" element={<MaintenanceCalendar />} />
        <Route path="production-schedule" element={<ProductionSchedule />} />
        <Route path="production-downtime" element={<Navigate to="/downtime/logs" replace />} />
        <Route path="machine-parameters" element={<MachineParameterPage />} />
        <Route path="production-kpi" element={<ProductionKPI />} />
        <Route path="shift-settings" element={<ShiftSettings />} />
        <Route path="maintenance-kpi" element={<MaintenanceKPI />} />
        <Route path="failure-codes" element={<FailureCodes />} />
        <Route path="downtime-classifications" element={<DowntimeClassifications />} />
        <Route path="ai-settings" element={<AISettings />} />
        <Route path="ai-reports" element={<ReportGeneratorPage />} />
        <Route path="ai-production-reports" element={<ProductionReportPage />} />
        <Route path="ai-admin" element={<AIAdminPage />} />

        {/* SPK Production Order System Routes */}
        <Route path="spk" element={<SPKList />} />
        <Route path="spk/new" element={<SPKForm />} />
        <Route path="spk/:id" element={<SPKDetail />} />
        <Route path="spk/:id/edit" element={<SPKForm />} />
        <Route path="products" element={<ProductList />} />
        <Route path="spareparts" element={<SparepartList />} />

        {/* Incoming Material Inspection Routes */}
        <Route path="incoming-inspection" element={<InspectionList />} />
        <Route path="incoming-inspection/new" element={<InspectionForm />} />
        <Route path="incoming-inspection/:id" element={<InspectionDetail />} />
        <Route path="incoming-inspection/:id/edit" element={<InspectionForm />} />
        <Route path="incoming-inspection/:inspectionId/complaint/new" element={<NewComplaintPage />} />
        <Route path="incoming-inspection/:inspectionId/complaint/:complaintId" element={<ComplaintDetailPage />} />

        {/* Digital Signage Routes */}
        <Route path="admin/digital-signage/templates" element={<TemplateList />} />
        <Route path="admin/digital-signage/templates/new" element={<TemplateForm />} />
        <Route path="admin/digital-signage/playlists" element={<PlaylistList />} />
        <Route path="admin/digital-signage/playlists/new" element={<PlaylistForm />} />
        <Route path="admin/digital-signage/playlists/:playlistId/slides" element={<SlideList />} />
          <Route path="admin/digital-signage/playlists/:playlistId/slides/new" element={<SlideForm />} />
          <Route path="admin/digital-signage/playlists/:playlistId/slides/:slideId/edit" element={<SlideForm />} />
          <Route path="admin/digital-signage/playlists/:playlistId/schedule" element={<PlaylistSchedule />} />

        <Route path="solar" element={<SolarDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;
