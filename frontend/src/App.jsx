import { useEffect, useCallback, useState } from 'react';
import logo from './logo.svg';
import './App.css';

const apiBase = 'http://localhost:3001';

export default function App() {
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
      if (data) {
        setLotteries(data);
        setSelectedLottery(data[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const GetUsers = async () => {
    try {
      const res = await fetch(`${apiBase}/users`);
      const data = await res.json();
      if (data) {
        setUsers(data);
        setSelectedUser(data[0]);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const GetUsersInLottery = useCallback(async () => {
    try {
      if (!selectedLottery) return;
      const res = await fetch(`${apiBase}/users/lottery/${selectedLottery.lotteryId}`);
      const data = await res.json();
      if (data) {
        setUsersInLottery(data);
      }
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
      if (data) {
        setLotteriesByUser(data);
      }
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
      console.log('reset');
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={reset}>Reset</button>
        Select Lottery 
        <select onChange={(event) => setSelectedLottery(JSON.parse(event.target.value))}>
          {lotteries.map((lottery, i) => {
            return <option key={i} value={JSON.stringify(lottery)}>
                {lottery.lotteryName}
              </option>
          })}
        </select>
          {console.log(selectedLottery)}
        {selectedLottery ? `${isLotteryDrawn ? 'Winners of' : 'Users in'} 
          ${selectedLottery.lotteryName}: ${usersInLottery.map(user => user.name).join(', ')}`
        : 'No lottery selected'}
        

        <button onClick={drawWinner} disabled={isLotteryDrawn}>
          Draw winners ({selectedLottery && selectedLottery.ticketsAvailable})
        </button>

        Select User
        <select onChange={(event) => setSelectedUser(JSON.parse(event.target.value))}>
          {users.map((user, i) => {
            return <option key={i} value={JSON.stringify(user)}>
                {user.name}
              </option>
          })}
        </select>

        {selectedUser ? 
          `Lotteries by ${selectedUser.name}: ${lotteriesByUser.map(lottery => lottery.lotteryName).join(', ')}`
          : 'No user selected'
        }

        <button onClick={toggleRegistration} disabled={isLotteryDrawn}>
          {isLotteryDrawn ? 'Lottery is over' 
            : isUserInLottery ? 'Withdraw from lotttery' : 'Register for lottery'}
        </button>
        {console.log(selectedLottery)
}
        <img src={logo} className="App-logo" alt="logo" />
      </header>
    </div>
  );
}
