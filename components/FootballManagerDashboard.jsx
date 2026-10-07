"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PLAYERS, FORM_POSITIONS } from "../lib/football-data";
import SignOutButton from "./SignOutButton";

const EMPTY_FORM = {
  name: "",
  position: "Midfielder",
  age: "",
  nationality: "",
  rating: "",
  starter: true,
};

export default function FootballManagerDashboard({ managerName }) {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [draggedPlayerId, setDraggedPlayerId] = useState(null);
  const [isPlayerPromptOpen, setIsPlayerPromptOpen] = useState(false);

  useEffect(() => {
    const savedPlayers = localStorage.getItem("football-manager-players");
    if (savedPlayers) {
      try {
        setPlayers(JSON.parse(savedPlayers));
      } catch (error) {
        console.error("Unable to read players from localStorage", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("football-manager-players", JSON.stringify(players));
  }, [players]);

  const firstEleven = useMemo(
    () => players.filter((player) => player.starter).slice(0, 11),
    [players],
  );

  const substitutes = useMemo(
    () => players.filter((player) => !player.starter),
    [players],
  );

  const formationRows = useMemo(() => {
    const starters = [...firstEleven];

    return [
      { label: "Forwards", players: starters.slice(9, 11) },
      { label: "Midfielders", players: starters.slice(5, 9) },
      { label: "Defenders", players: starters.slice(1, 5) },
      { label: "Goalkeeper", players: starters.slice(0, 1) },
    ];
  }, [firstEleven]);

  const hasReachedFirstElevenLimit = firstEleven.length >= 11;

  const averageRating = useMemo(() => {
    if (!players.length) return 0;
    const total = players.reduce(
      (sum, player) => sum + Number(player.rating),
      0,
    );
    return (total / players.length).toFixed(1);
  }, [players]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setMessage("");
  }

  function openPlayerPrompt(player = null) {
    if (player) {
      setEditingId(player.id);
      setForm({
        name: player.name,
        position: player.position,
        age: String(player.age),
        nationality: player.nationality,
        rating: String(player.rating),
        starter: Boolean(player.starter),
      });
      setMessage(`Editing ${player.name}.`);
    } else {
      resetForm();
    }
    setIsPlayerPromptOpen(true);
  }

  function closePlayerPrompt() {
    setIsPlayerPromptOpen(false);
    resetForm();
  }

  function handleSubmit(event) {
    event.preventDefault();

    const newPlayer = {
      id: editingId ?? Date.now(),
      name: form.name.trim(),
      position: form.position,
      age: Number(form.age) || 18,
      nationality: form.nationality.trim() || "Unknown",
      rating: Number(form.rating) || 70,
      starter: Boolean(form.starter),
    };

    if (!newPlayer.name) {
      setMessage("Player name is required.");
      return;
    }

    setPlayers((current) => {
      if (editingId) {
        return current.map((player) =>
          player.id === editingId ? { ...player, ...newPlayer } : player,
        );
      }

      return [newPlayer, ...current];
    });

    setMessage(
      editingId ? "Player updated successfully." : "Player added successfully.",
    );
    setIsPlayerPromptOpen(false);
    resetForm();
  }

  function handleEdit(player) {
    openPlayerPrompt(player);
  }

  function handleDelete(id) {
    setPlayers((current) => current.filter((player) => player.id !== id));
    if (editingId === id) {
      resetForm();
    }
    setMessage("Player removed from squad.");
  }

  function reorderFirstEleven(droppedId) {
    if (!draggedPlayerId || draggedPlayerId === droppedId) {
      setDraggedPlayerId(null);
      return;
    }

    setPlayers((current) => {
      const starters = current.filter((player) => player.starter);
      const fromIndex = starters.findIndex(
        (player) => player.id === draggedPlayerId,
      );
      const toIndex = starters.findIndex((player) => player.id === droppedId);

      if (fromIndex === -1 || toIndex === -1) {
        return current;
      }

      const reorderedStarters = [...starters];
      const [movedPlayer] = reorderedStarters.splice(fromIndex, 1);
      reorderedStarters.splice(toIndex, 0, movedPlayer);

      const nextStarterIds = new Set(
        reorderedStarters.map((player) => player.id),
      );

      return current.map((player) => ({
        ...player,
        starter: nextStarterIds.has(player.id),
      }));
    });

    setDraggedPlayerId(null);
    setMessage("First eleven order updated.");
  }

  function toggleFirstEleven(id) {
    setPlayers((current) => {
      const selectedPlayer = current.find((player) => player.id === id);
      if (!selectedPlayer) return current;

      if (selectedPlayer.starter) {
        return current.map((player) =>
          player.id === id ? { ...player, starter: false } : player,
        );
      }

      if (hasReachedFirstElevenLimit) {
        setMessage(
          "The first eleven is already full. Remove one player before adding another.",
        );
        return current;
      }

      return current.map((player) =>
        player.id === id ? { ...player, starter: true } : player,
      );
    });

    const selectedPlayer = players.find((player) => player.id === id);
    if (!selectedPlayer) {
      return;
    }

    if (selectedPlayer.starter) {
      setMessage(`${selectedPlayer.name} removed from the first eleven.`);
      return;
    }

    if (hasReachedFirstElevenLimit) {
      return;
    }

    setMessage(`${selectedPlayer.name} added to the first eleven.`);
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Football Manager</p>
          <h1>Riverside FC</h1>
        </div>
        <div className="topbar-meta">
          <span>Manager: {managerName}</span>
          <button
            type="button"
            className="secondary-button small"
            onClick={() => openPlayerPrompt()}
          >
            Add New Player
          </button>
          <SignOutButton />
        </div>
      </header>

      <section className="stats-grid">
        <article className="stat-card accent">
          <span>Total Squad</span>
          <strong>{players.length}</strong>
        </article>
        <article className="stat-card">
          <span>First Eleven</span>
          <strong>{firstEleven.length}</strong>
        </article>
        <article className="stat-card">
          <span>Avg Rating</span>
          <strong>{averageRating}</strong>
        </article>
        <article className="stat-card">
          <span>Available</span>
          <strong>{players.filter((player) => player.starter).length}</strong>
        </article>
      </section>

      <section className="panel-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>First Eleven</h2>
            <span>{firstEleven.length} starters</span>
          </div>

          <div className="formation-pitch">
            {formationRows.map((row) => (
              <div className="formation-row" key={row.label}>
                {row.players.length === 0 && (
                  <div className="formation-slot empty-slot">{row.label}</div>
                )}

                {row.players.map((player) => (
                  <div
                    className={`formation-card ${draggedPlayerId === player.id ? "is-dragging" : ""}`}
                    key={player.id}
                    draggable
                    onDragStart={() => setDraggedPlayerId(player.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => reorderFirstEleven(player.id)}
                    onDragEnd={() => setDraggedPlayerId(null)}
                  >
                    <span className="shirt-number">#{player.id}</span>
                    <h3>{player.name}</h3>
                    <p>{player.position}</p>
                    <div className="formation-rating">{player.rating}</div>
                    <button
                      type="button"
                      className="secondary-button small full-width"
                      onClick={() => toggleFirstEleven(player.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Substitutes</h2>
            <span>{substitutes.length} bench</span>
          </div>

          <div className="substitute-list">
            {substitutes.length === 0 ? (
              <p className="panel-copy">
                All players are currently in the first eleven.
              </p>
            ) : (
              substitutes.map((player) => (
                <div key={player.id} className="substitute-item">
                  <div>
                    <strong>{player.name}</strong>
                    <p>
                      {player.position} • {player.rating}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="primary-button small"
                    onClick={() => toggleFirstEleven(player.id)}
                  >
                    Add XI
                  </button>
                </div>
              ))
            )}
          </div>

          {message && <p className="status-message">{message}</p>}
        </div>
      </section>

      {isPlayerPromptOpen && (
        <div className="modal-backdrop" onClick={closePlayerPrompt}>
          <div
            className="modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="panel-header modal-header">
              <h2>{editingId ? "Edit Player" : "Add New Player"}</h2>
              <button
                type="button"
                className="secondary-button small"
                onClick={closePlayerPrompt}
              >
                Close
              </button>
            </div>

            <form className="player-form" onSubmit={handleSubmit}>
              <label>
                Full name
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Player name"
                />
              </label>

              <div className="two-col">
                <label>
                  Position
                  <select
                    name="position"
                    value={form.position}
                    onChange={handleChange}
                  >
                    {FORM_POSITIONS.map((position) => (
                      <option key={position} value={position}>
                        {position}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Age
                  <input
                    name="age"
                    type="number"
                    min="16"
                    max="45"
                    value={form.age}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="two-col">
                <label>
                  Nationality
                  <input
                    name="nationality"
                    value={form.nationality}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </label>

                <label>
                  Rating
                  <input
                    name="rating"
                    type="number"
                    min="1"
                    max="99"
                    value={form.rating}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <label className="checkbox-row">
                <input
                  type="checkbox"
                  name="starter"
                  checked={form.starter}
                  onChange={handleChange}
                />
                Include in first eleven
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-button">
                  {editingId ? "Update Player" : "Add Player"}
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closePlayerPrompt}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="panel player-table-panel">
        <div className="panel-header">
          <h2>Squad List</h2>
          <span>{players.length} players</span>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Age</th>
                <th>Country</th>
                <th>Rating</th>
                <th>Starter</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{player.name}</td>
                  <td>{player.position}</td>
                  <td>{player.age}</td>
                  <td>{player.nationality}</td>
                  <td>{player.rating}</td>
                  <td>{player.starter ? "Yes" : "No"}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="secondary-button small"
                        onClick={() => handleEdit(player)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={
                          player.starter
                            ? "secondary-button small"
                            : "primary-button small"
                        }
                        onClick={() => toggleFirstEleven(player.id)}
                      >
                        {player.starter ? "Remove XI" : "Add XI"}
                      </button>
                      <button
                        type="button"
                        className="danger-button small"
                        onClick={() => handleDelete(player.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
