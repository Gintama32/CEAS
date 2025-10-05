import React from "react";

function Dashboard() {
    const handleBackendCall = () => {
        fetch("http://localhost:8000/", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => response.json())
    .then(data => console.log(data))
    .catch(error => console.error("Error:", error));
    }
  return (
  <div>
    <div>
    This is the dashboard
    </div>
    <button onClick={handleBackendCall}>Backend call</button>
  </div>
);
}
export default Dashboard;
