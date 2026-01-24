
import Navbar from '../components/Navbar.jsx';
import '../Styles/Home.css'; 

const Home = () => {
  return (
    <div className="dashboard-container">
   
<Navbar/>
      <main className="main-content">
      
        <header className="top-bar">
          <div className="welcome-text">
            <h1>Home</h1>
            <p>Indian Institute of Information Technology Gwalior</p>
          </div>
          <div className="header-actions">
            <input type="text" placeholder="Search..." className="search-input" />
            <div className="user-profile">
               <span className="user-initials">FM</span>
            </div>
          </div>
        </header>

        <div className="grid-container">
          
          <div className="card green-card">
            <div className="card-header">
              <h3>BMS-III</h3>
            </div>
            <div className="big-stat">
              <h1>65%</h1>
              <span>Attendance</span>
            </div>
            <div className="mini-stats">
              <p>56 Attended</p>
              <p>45 Missed</p>
            </div>
            <button className="view-btn">View Details</button>
          </div>

          <div className="card">
            <h3>Assignment Statistics</h3>
            <div className="chart-container">
        
              <div className="pie-chart">
                 <div className="pie-hole">24%</div>
              </div>
              <ul className="legend">
                <li><span className="dot yellow"></span>Submitted</li>
                <li><span className="dot teal"></span> Pending</li>
                <li><span className="dot orange"></span> Cancelled</li>
              </ul>
            </div>
          </div>

         
          <div className="card">
            <h3>Quiz</h3>
            <div className="rings-container">
               <div className="ring-wrapper">
                 <div className="ring green-ring">70%</div>
                 <p>Maximum</p>
               </div>
               <div className="ring-wrapper">
                 <div className="ring orange-ring">24%</div>
                 <p>Average</p>
               </div>
            </div>
          </div>


          <div className="card wide-card">
            <div className="card-header-flex">
              <h3>Attendance Analytics</h3>
              <select><option>Monthly</option></select>
            </div>
            <div className="bar-chart">
           
               {[40, 60, 35, 70, 50, 80, 60, 90, 40, 70, 55, 80].map((h, i) => (
                 <div key={i} className="bar-column">
                   <div className="bar" style={{height: `${h}px`}}>{h}%</div>
                   <span className="label">w{i+1}</span>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Home;