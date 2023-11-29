import { useEffect, useCallback, useState } from 'react';
import ConfettiExplosion from 'react-confetti-explosion';
import { Analytics } from '@vercel/analytics/react';
import logo from './logo.svg';
import './App.css';

const apiBase = process.env.DEV ? 'http://localhost:3001' : 'https://lotterydb-express.vercel.app';

export default function App() {
  const [isConfettiExploding, setIsConfettiExploding] = useState(false);
  const [lotteries, setLotteries] = useState([]);
  const [lotteriesByUser, setLotteriesByUser] = useState([]);
  const [selectedLottery, setSelectedLottery] = useState(null);
  const [isLotteryDrawn, setIsLotteryDrawn] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersInLottery, setUsersInLottery] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserInLottery, setIsUserInLottery] = useState(false);

  useEffect(() => {
    GetLotteries();
    GetUsers();
  }, []);

  const GetLotteries = async () => {
    try {
      const res = await fetch(`${apiBase}/lotteries`);
      const data = await res.json();
      setLotteries(data);
      setSelectedLottery(data[0]);
    } catch (error) {
      console.log('failed to fetch lotteries from database:', error);
    }
  }

  const GetUsers = async () => {
    try {
      const res = await fetch(`${apiBase}/users`);
      const data = await res.json();
      setUsers(data);
      setSelectedUser(data[0]);
    } catch (error) {
      console.log('failed to fetch users from database:', error);
    }
  }

  const GetUsersInLottery = useCallback(async () => {
    try {
      if (!selectedLottery) return;
      const res = await fetch(`${apiBase}/users/lottery/${selectedLottery.lotteryId}`);
      const data = await res.json();
      setUsersInLottery(data);
    } catch (error) {
      console.log(error);
    }
  }, [selectedLottery]);
  
  useEffect(() => {
      GetUsersInLottery();
  }, [selectedLottery, GetUsersInLottery, isUserInLottery]);

  const GetLotteriesByUser = useCallback(async () => {
    try {
      if (!selectedUser) return;
      const res = await fetch(`${apiBase}/lotteries/${selectedUser.userId}`);
      const data = await res.json();
      setLotteriesByUser(data);
     } catch (error) {
      console.log(error);
    }
  }, [selectedUser]);

  useEffect(() => {
    GetLotteriesByUser();
  }, [selectedUser, GetLotteriesByUser, isUserInLottery]);

  const IsUserInLottery = useCallback(async () => {
    try {
      if (!selectedUser || !selectedLottery) return;
      const res = await fetch(`${apiBase}/lotteryentries/${selectedUser.userId}/${selectedLottery.lotteryId}`);
      const data = await res.json();
      setIsLotteryDrawn(data.drawn);
      setIsUserInLottery(data.registered);
    } catch (error) {
      console.log(error)
    }
  }, [selectedUser, selectedLottery])

  useEffect(() => {
    IsUserInLottery();
  }, [selectedUser, selectedLottery, isUserInLottery, IsUserInLottery])

  const toggleRegistration = async () => {
    try {
      await fetch(`${apiBase}/lotteryentries/${selectedUser.userId}/${selectedLottery.lotteryId}`, {
        method: isUserInLottery ? 'DELETE' : 'POST'
      });
      setIsUserInLottery(!isUserInLottery);
    } catch (error) {
      console.log(error);
    }
  }

  const drawWinner = async () => {
    try {
      const res = await fetch(`${apiBase}/lotteries/draw/${selectedLottery.lotteryId}`, {
        method: 'POST'
      });
      const winners = await res.json();
      setUsersInLottery(winners);
      IsUserInLottery();
      setIsConfettiExploding(true);
      setTimeout(() => setIsConfettiExploding(false), 3000);
    } catch (error) {
      console.log(error);
    }
  }

  const reset = async () => {
    try {
      await fetch(`${apiBase}/reset`, {
        method: 'POST'
      });
      IsUserInLottery();
      GetLotteriesByUser();
      GetUsersInLottery();
     } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      <Analytics/>
      <header className="App-header">
        <button onClick={reset} className="reset-button">Reset</button>
        
        {isConfettiExploding && <ConfettiExplosion/>}

        <div className="select-container">
        <div className="lottery-dialog">
          <label>Select Lottery</label>
          <select onChange={(event) => setSelectedLottery(JSON.parse(event.target.value))}>
            {lotteries.map((lottery, i) => {
              return <option key={i} value={JSON.stringify(lottery)}>
                  {lottery.lotteryName}
                </option>
            })}
          </select>

          <div>
            {selectedLottery ? `${isLotteryDrawn ? 'Winners of' : 'Users in'} 
              ${selectedLottery.lotteryName} lottery:`
            : 'No lottery selected'}
          </div>
          <div>
            {selectedLottery && usersInLottery.map(user => user.name).join(', ')}
          </div>

          <button onClick={drawWinner} disabled={isLotteryDrawn}>
            Draw winners ({selectedLottery && selectedLottery.ticketsAvailable})
          </button>
        </div>

        <div className="user-dialog">
          <label>Select User</label>
          <select onChange={(event) => setSelectedUser(JSON.parse(event.target.value))}>
            {users.map((user, i) => {
              return <option key={i} value={JSON.stringify(user)}>
                  {user.name}
                </option>
            })}
          </select>

          <div>
            {selectedUser ? `${selectedUser.name}'s lotteries:` : 'No user selected'}
          </div>
          <div>
            {selectedUser && lotteriesByUser.map(lottery => lottery.lotteryName).join(', ')}
          </div>

          <button onClick={toggleRegistration} disabled={isLotteryDrawn}>
            {isLotteryDrawn ? 'Lottery is over' 
              : `${isUserInLottery ? `Withdraw from` : 'Register for'} 
              ${selectedLottery && selectedLottery.lotteryName} lottery`}
          </button>
        </div>
        </div>
        
        <img src={logo} className="App-logo" alt="logo" />
      </header>
    </div>
  );
}
