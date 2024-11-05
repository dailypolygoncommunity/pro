import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import DailyCash from './contract/DailyCash.json';
import './App.css';

// Component for calculating potential donation plans
function InvestmentPlanCalculator({ investmentAmount, setInvestmentAmount, investmentDays, setInvestmentDays, result, setResult }) {
  const calculateInvestment = () => {
    const amount = parseFloat(investmentAmount);
    const days = parseInt(investmentDays);

    if (isNaN(amount) || isNaN(days) || amount <= 0 || days <= 0) {
      alert("Please enter a valid investment amount and number of days.");
      return;
    }

    let dailyPercentage = 0;
    if (amount >= 1 && amount <= 500) {
      dailyPercentage = 4;
    } else if (amount >= 501 && amount <= 5000) {
      dailyPercentage = 4.2;
    } else if (amount >= 5001 && amount <= 20000) {
      dailyPercentage = 4.5;
    } else {
      alert("Investment amount is outside the supported range.");
      return;
    }

    const profit = amount * days * (dailyPercentage / 100);
    setResult(profit.toFixed(2));
  };

  return (
    <div className="investment-calculator">
      <h3>Donation Calculator</h3>
      <input
        type="number"
        placeholder="Investment Amount (POL)"
        value={investmentAmount}
        onChange={(e) => setInvestmentAmount(e.target.value)}
      />
      <input
        type="number"
        placeholder="Number of Days"
        value={investmentDays}
        onChange={(e) => setInvestmentDays(e.target.value)}
      />
      <button onClick={calculateInvestment}>Calculate</button>
      <h4>Result: {result} POL</h4>
    </div>
  );
}

// Modal component for displaying messages
function Modal({ show, onClose, message }) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <p>{message}</p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function App() {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [bonus, setBonus] = useState(0);
  const [amount, setAmount] = useState('');
  const [referrer, setReferrer] = useState('');
  const [hasInvested, setHasInvested] = useState(false);
  const [previousReferrer, setPreviousReferrer] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentDays, setInvestmentDays] = useState('');
  const [result, setResult] = useState(0);

  const smartContractOwnWalletAddress = "0xA531D8A9a62a694e4C8520c52f2d9968fa3B3E7c";

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        try {
          const networkId = await web3.eth.net.getId();
          const deployedNetwork = DailyCash.networks[networkId];
          if (deployedNetwork && deployedNetwork.address) {
            const instance = new web3.eth.Contract(DailyCash.abi, deployedNetwork.address);
            setContract(instance);
          } else {
            console.error("Contract not deployed on this network.");
          }
        } catch (error) {
          console.error("Error fetching network ID:", error);
        }
      } else {
        console.error("Ethereum object not found. Please install MetaMask.");
      }
    };

    const fetchReferrerFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const referrerParam = params.get('ref');
      if (referrerParam) {
        setReferrer(referrerParam);
      }
    };

    initWeb3();
    fetchReferrerFromUrl();
  }, []);

  const handleConnectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setBonus(0);
    setHasInvested(false);
    setPreviousReferrer('');
    setReferrer('');
    console.log("Wallet disconnected.");
  };

  const handleGetBonus = async () => {
    if (!account || !contract) {
      console.error("Wallet not connected or contract not initialized");
      return;
    }
    try {
      const totalBonus = await contract.methods.getUserAvailable(account).call();
      setBonus(Web3.utils.fromWei(totalBonus, 'ether'));
    } catch (error) {
      console.error("Failed to retrieve bonus:", error);
    }
  };

  const handleMakeInvestment = async (event) => {
    event.preventDefault();
    if (!account || !contract) {
      setModalMessage("Wallet not connected or contract not initialized");
      setShowModal(true);
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setModalMessage("Invalid investment amount");
      setShowModal(true);
      return;
    }

    const referrerAddress = hasInvested ? previousReferrer : (referrer || smartContractOwnWalletAddress);
    if (!hasInvested) {
      setPreviousReferrer(referrerAddress);
      setHasInvested(true);
    }

    try {
      await contract.methods.invest(referrerAddress).send({
        from: account,
        value: Web3.utils.toWei(amount, 'ether'),
      });
      setModalMessage("Investment successful!");
    } catch (error) {
      setModalMessage("Investment failed: " + error.message);
    }
    setShowModal(true);
  };

  const handleWithdraw = async () => {
    if (!account || !contract) {
      setModalMessage("Wallet not connected or contract not initialized");
      setShowModal(true);
      return;
    }
    try {
      await contract.methods.withdraw().send({ from: account });
      setModalMessage("Withdrawal successful!");
    } catch (error) {
      setModalMessage("Withdrawal failed: " + error.message);
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  return (
    <div className="App">
      <div className="header">
        <h1 className="app-title">Daily Polygon Community</h1>
        <h4 className="app-subtitle">"Building a Brighter Future Through Collective Giving"</h4>
      </div>
      <div className="content-box">
        <div className="container">
          {account ? (
            <div className="dashboard">
              <p className="connected-account">
                Connected Account: {account.substring(0, 6)}...{account.substring(account.length - 4)}
              </p>
              <p className="grant-info">
                Grant for You: {parseFloat(bonus).toFixed(8)} POL
              </p>
              <div className="button-group">
                <button onClick={handleGetBonus} className="bonus-button">Check Your Available Grant</button>
              </div>
              <form onSubmit={handleMakeInvestment} className="investment-form">
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Referrer Address"
                    value={!hasInvested ? referrer : previousReferrer}
                    onChange={(e) => !hasInvested ? setReferrer(e.target.value) : null}
                    className="input-field"
                    disabled={hasInvested}
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Amount in POL"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div className="button-group">
                  <button type="submit" className="invest-button">Give Donations</button>
                  <button type="button" onClick={handleWithdraw} className="withdraw-button">Get Donations</button>
                </div>
              </form>
              <button onClick={handleDisconnect} className="disconnect-button">Disconnect Wallet</button>
              <InvestmentPlanCalculator 
                investmentAmount={investmentAmount}
                setInvestmentAmount={setInvestmentAmount}
                investmentDays={investmentDays}
                setInvestmentDays={setInvestmentDays}
                result={result}
                setResult={setResult}
              />
            </div>
          ) : (
            <button onClick={handleConnectWallet} className="connect-button">Connect Wallet</button>
          )}
        </div>
      </div>
      <Modal show={showModal} onClose={closeModal} message={modalMessage} />
    </div>
  );
}

export default App;
