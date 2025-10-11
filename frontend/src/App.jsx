import Dashboard from '../pages/Dashboard'
import Navigation from './components/Navigation'
import './App.css'

function App() {
  return (
    <>
      {/* Navigation is completely separate at the top */}
      <Navigation />
      
      {/* Main content area with padding-top to account for fixed navigation */}
      <div style={{ 
        width: '100%',
        minHeight: 'calc(100vh - 70px)', // Adjust based on navigation height
        paddingTop: '80px' // This should be at least the height of your navigation bar
      }}>
        <Dashboard />
      </div>
    </>
  )
}

export default App
