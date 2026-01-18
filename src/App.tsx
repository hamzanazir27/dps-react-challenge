import AddressValidator from './components/AddressValidator';
import dpsLogo from './assets/DPS.svg';
import './App.css';

function App() {
	return (
		<div className="app-container">
			<div className="app-header">
				<a href="https://www.digitalproductschool.io/" target="_blank" rel="noopener noreferrer">
					<img src={dpsLogo} className="logo" alt="DPS logo" />
				</a>
			</div>
			<AddressValidator />
		</div>
	);
}

export default App;

