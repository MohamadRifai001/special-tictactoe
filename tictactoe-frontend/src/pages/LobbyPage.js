import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  startGame,
  getLobbyStatus,
  playerReadyUp,
  sendHeartbeat,
} from "../services/api";
import { useLocation } from "react-router-dom";
import "../styles/LobbyPage.css";

function LobbyPage() {
  const { lobbyCode } = useParams();
  const location = useLocation();
  const playerName = location.state?.playerName;
  const [players, setPlayers] = useState([]);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const [fetchFailures, setFetchFailures] = useState(0);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const status = await getLobbyStatus(lobbyCode);
        if (status) {
          setPlayers([status.player1, status.player2].filter(Boolean));
          if (status.started) {
            navigate(`/game/${lobbyCode}`, {
              state: { playerName: playerName.name },
            });
          }
        }
        setFetchFailures(0); // Reset fetch failures on successful fetch
      } catch (error) {
        console.error("Error fetching lobby status:", error);
        setFetchFailures((prev) => prev + 1);
        if (fetchFailures >= 3) {
          alert("Failed to fetch lobby status. Please try again later.");
          clearInterval(interval);
          navigate("/"); // Redirect to home page or handle as needed
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lobbyCode, navigate]);

  useEffect(() => {
    const heartbeat = setInterval(() => {
      sendHeartbeat(lobbyCode, playerName.name);
    }, 10000);

    return () => clearInterval(heartbeat);
  }, [lobbyCode, playerName]);

  const handleReady = async () => {
    if (!playerName) {
      alert("Player name is required.");
      return;
    }

    await playerReadyUp(lobbyCode, playerName.name);
    setReady(true);

    const status = await getLobbyStatus(lobbyCode);

    if (status && status.started) {
      try {
        console.log(
          "Starting game... Lobby code:",
          lobbyCode,
          "Player 1:",
          players[0],
          "Player 2:",
          players[1]
        );
        await startGame(lobbyCode, players[0], players[1]);
      } catch (err) {
        console.error("Error creating game:", err);
        alert("Error creating game. Please try again.");
      }
    }
  };

  return (
    <div className="lobby-page">
      <h2> Share this lobby code to invite a friend: {lobbyCode}</h2>
      <p className="waiting-text dots">Waiting for Players</p>
      <ul>
        {players.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      {players.length === 2 && !ready && (
        <button className="button-slide" onClick={handleReady}>
          Ready
        </button>
      )}
      {ready && <p>Waiting for other player to start...</p>}
    </div>
  );
}

export default LobbyPage;
