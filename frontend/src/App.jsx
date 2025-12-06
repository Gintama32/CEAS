import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import ProjectPage from '../pages/ProjectPage';
import ProjectEstimatesList from '../pages/ProjectEstimatesList';
import ProjectEstimateView from '../pages/ProjectEstimateView';
import DataPage from '../pages/DataPage';
import EstimatesPage from '../pages/EstimatesPage';
import TemplatesPage from '../pages/TemplatesPage';
import Database from '../pages/Database';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* Navigation is completely separate at the top */}
      <Navigation />
      
      {/* Main content area with padding-top to account for fixed navigation */}
      <div style={{ 
        width: '100%',
        minHeight: 'calc(100vh - 50px)', // Adjust based on navigation height
        paddingTop: '50px' // This should be at least the height of your navigation bar
      }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectPage />} />
          <Route path="/projects/:projectId/estimates" element={<ProjectEstimatesList />} />
          <Route path="/projects/:projectId/estimates/:estimateId" element={<ProjectEstimateView />} />
          <Route path="/projects/:projectId/add-item" element={<DataPage />} />
          <Route path="/database" element={<Database />} />
          <Route path="/estimates" element={<EstimatesPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
