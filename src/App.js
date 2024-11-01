import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import DailyCash from './contract/DailyCash.json';

function InvestmentPlanCalculator() {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentDays, setInvestmentDays] = useState('');
  const [result, setResult] = useState(0);

  const calculateInvestment = () => {
    const amount = parseFloat(investmentAmount);
    const days = parseInt(investmentDays);

    if (isNaN(amount) || isNaN(days) || amount <= 0 || days <= 0) {
      alert("Please enter valid investment amount and number of days.");
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
      <h3>Donations Calculator</h3>
      <input
        type="number"
        placeholder="Donations Amount (USD)"
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
      <h4>Result: {result} USD</h4>
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

  const smartContractOwnWalletAddress = "0x8A7C94E02F7B8c381693314d797568692cd1cBD6";

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
      const referrerParam = params.get('ref'); // Fetching ref parameter
      if (referrerParam) {
        setReferrer(referrerParam);
        console.log("Referrer from URL:", referrerParam); // Log the referrer
      }
    };

    initWeb3();
    fetchReferrerFromUrl();
  }, []);

  const handleConnectWallet = async () => {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      console.log("Connected account:", accounts[0]);
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setBonus(0);
    setHasInvested(false);
    setPreviousReferrer('');
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
      console.log("Total bonus:", totalBonus);
    } catch (error) {
      console.error("Failed to retrieve bonus:", error);
    }
  };

  const handleMakeInvestment = async (event) => {
    event.preventDefault();
    if (!account || !contract) {
      console.error("Wallet not connected or contract not initialized");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      console.error("Invalid investment amount");
      return;
    }

    let referrerAddress;
    if (hasInvested) {
      referrerAddress = previousReferrer; // Use stored referrer for future investments
    } else {
      referrerAddress = referrer || smartContractOwnWalletAddress; // Use form input or default on first investment
      setPreviousReferrer(referrerAddress); // Save referrer for subsequent investments
      setHasInvested(true); // Mark as having invested
    }

    console.log(`Making investment of ${amount} POL with referrer ${referrerAddress}`);
    try {
      const transactionHash = await contract.methods.invest(referrerAddress).send({
        from: account,
        value: Web3.utils.toWei(amount, 'ether'),
      });
      console.log("Investment successful, transaction hash:", transactionHash);
    } catch (error) {
      console.error("Investment failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!account || !contract) {
      console.error("Wallet not connected or contract not initialized");
      return;
    }
    try {
      const transactionHash = await contract.methods.withdraw().send({
        from: account,
      });
      console.log("Withdrawal successful, transaction hash:", transactionHash);
    } catch (error) {
      console.error("Withdrawal failed:", error);
    }
  };

  return (
    <div className="App">
       <div style={{ backgroundColor: '', padding: '20px' }}>
            <h1>Daily Cash Community</h1>
            <h2>"Building a Brighter Future Through Collective Giving"</h2>
        </div>
      <div className="container">
        {account ? (
          <div className="dashboard">
            <h2>Connected Account: {account.substring(0, 6)}...{account.substring(account.length - 4)}</h2>
            <h2>Grant for You: {parseFloat(bonus).toFixed(8)} POL</h2>
            <div className="button-group">
              <button onClick={handleDisconnect} className="disconnect-button">Disconnect Wallet</button>
              <button onClick={handleGetBonus} className="bonus-button">Check Your Available Grant</button>
            </div>
            <form onSubmit={handleMakeInvestment} className="investment-form">
              {!hasInvested && (
                <input
                  type="text"
                  placeholder="Referrer Address"
                  value={referrer}
                  onChange={(e) => setReferrer(e.target.value)}
                  className="input-field"
                />
              )}
              <input
                type="number"
                min="0"
                placeholder="Amount in POL"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="input-field"
              />
              <div className="investment-buttons">
                <button type="submit" className="invest-button">Give Donations</button>
                <button type="button" onClick={handleWithdraw} className="withdraw-button">Get Donations</button>
              </div>
            </form>
            <InvestmentPlanCalculator />
          </div>
        ) : (
          <button onClick={handleConnectWallet} className="connect-button">Connect Wallet</button>
        )}
      </div>
    </div>
  );
}

export default App;
