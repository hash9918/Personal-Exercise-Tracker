import React, { useEffect, useState } from "react";
import { Plus, Play, Pencil, Trash2, Check, ImagePlus, Dumbbell } from "lucide-react";
import { api, imageSrc } from "../api";
import TimerView from "../components/TimerView";

function emptyForm() {
  return { name: "", sets: "", reps: "", duration: 30, imageUrl: "", file: null, preview: "" };
}

export default function Dashboard() {
  const [exercises, setExercises] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [restSeconds, setRestSeconds] = useState(15);
  const [session, setSession] = useState(null); // { mode, list }
  const [error, setError] = useState("");

  async function load() {
    try {
      const res = await api.listExercises();
      setExercises(res.exercises);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openAddForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(ex) {
    setForm({
      name: ex.name,
      sets: ex.sets ?? "",
      reps: ex.reps ?? "",
      duration: ex.duration,
      imageUrl: ex.image && !ex.image.startsWith("/uploads/") ? ex.image : "",
      file: null,
      preview: imageSrc(ex.image),
    });
    setEditingId(ex._id);
    setShowForm(true);
  }

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, file, preview: reader.result }));
    reader.readAsDataURL(file);
  }

  async function submitForm(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("sets", form.sets);
    fd.append("reps", form.reps);
    fd.append("duration", form.duration);
    if (form.imageUrl) fd.append("imageUrl", form.imageUrl);
    if (form.file) fd.append("image", form.file);

    try {
      if (editingId) {
        await api.updateExercise(editingId, fd);
      } else {
        await api.createExercise(fd);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteExercise(id) {
    try {
      await api.deleteExercise(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  function startSingle(ex) {
    setSession({ mode: "single", list: [ex] });
  }
  function startCircuit() {
    if (exercises.length === 0) return;
    setSession({ mode: "circuit", list: exercises });
  }
  function closeSession() {
    setSession(null);
    load(); // refresh in case anything changed
  }

  if (session) {
    return (
      <TimerView
        exercises={session.list}
        mode={session.mode}
        restSeconds={restSeconds}
        onClose={closeSession}
      />
    );
  }

  return (
    <>
      <div className="cb-toprow">
        <button className="cb-btn cb-btn-primary" onClick={openAddForm}>
          <Plus size={16} /> Add exercise
        </button>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div className="cb-rest-input">
            Rest between moves
            <input
              type="number"
              min="0"
              value={restSeconds}
              onChange={(e) => setRestSeconds(Math.max(0, Number(e.target.value) || 0))}
            />
            sec
          </div>
          <button className="cb-btn cb-btn-brass" onClick={startCircuit} disabled={exercises.length === 0}>
            <Play size={15} /> Start full circuit
          </button>
        </div>
      </div>

      {error && <div className="cb-error" style={{ marginBottom: 12 }}>{error}</div>}

      {showForm && (
        <form className="cb-form" onSubmit={submitForm}>
          <div className="cb-form-title">{editingId ? "Edit exercise" : "New exercise"}</div>
          <div className="cb-form-grid">
            <div className="cb-field span2">
              <label>Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Push ups"
                autoFocus
              />
            </div>
            <div className="cb-field">
              <label>Sets (optional)</label>
              <input
                type="number"
                min="0"
                value={form.sets}
                onChange={(e) => setForm((f) => ({ ...f, sets: e.target.value }))}
                placeholder="3"
              />
            </div>
            <div className="cb-field">
              <label>Reps (optional)</label>
              <input
                type="number"
                min="0"
                value={form.reps}
                onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
                placeholder="15"
              />
            </div>
            <div className="cb-field">
              <label>Duration (seconds)</label>
              <input
                type="number"
                min="5"
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              />
            </div>
            <div className="cb-field">
              <label>Image / GIF</label>
              <div className="cb-img-row">
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://... (or upload a file)"
                />
                <label className="cb-file-btn">
                  <ImagePlus size={15} />
                  <input type="file" accept="image/*" onChange={handleFile} />
                </label>
                {form.preview && (
                  <div className="cb-preview">
                    <img src={form.preview} alt="" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="cb-form-actions">
            <button
              type="button"
              className="cb-btn cb-btn-ghost"
              onClick={() => setShowForm(false)}
              style={{ color: "var(--ink-muted)", borderColor: "var(--rule)" }}
            >
              Cancel
            </button>
            <button type="submit" className="cb-btn cb-btn-primary">
              <Check size={15} /> {editingId ? "Save changes" : "Add to circuit"}
            </button>
          </div>
        </form>
      )}

      {loaded && exercises.length === 0 && !showForm && (
        <div className="cb-empty">
          <div className="cb-name">No exercises yet</div>
          <p>Add your first move to start building today's circuit.</p>
          <button className="cb-btn cb-btn-primary" onClick={openAddForm}>
            <Plus size={16} /> Add exercise
          </button>
        </div>
      )}

      <div className="cb-list">
        {exercises.map((ex, i) => (
          <div className="cb-card" key={ex._id}>
            <div className="cb-num">{String(i + 1).padStart(2, "0")}</div>
            <div className="cb-thumb">
              {ex.image ? <img src={imageSrc(ex.image)} alt="" /> : <Dumbbell size={20} color="#a49d8a" />}
            </div>
            <div className="cb-info">
              <div className="cb-name">{ex.name}</div>
              <div className="cb-meta">
                {(ex.sets || ex.reps) && (
                  <span className="cb-badge cb-badge-reps">
                    {ex.sets ? `${ex.sets}×` : ""}
                    {ex.reps ? ex.reps : ""}
                  </span>
                )}
                <span className="cb-badge cb-badge-time">{formatDuration(ex.duration)}</span>
              </div>
            </div>
            <div className="cb-actions">
              <button className="cb-icon-btn" onClick={() => openEditForm(ex)} aria-label="Edit">
                <Pencil size={16} />
              </button>
              <button className="cb-icon-btn" onClick={() => deleteExercise(ex._id)} aria-label="Delete">
                <Trash2 size={16} />
              </button>
              <button className="cb-start-btn" onClick={() => startSingle(ex)} aria-label={`Start ${ex.name}`}>
                <Play size={17} fill="#f6efe6" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
