import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:4000/graphql";

const CHECKLIST = [
  "Release branch created",
  "All relevant PRs merged",
  "CHANGELOG updated",
  "Version number updated",
  "Tests passing",
  "Deployed to staging",
  "Smoke tests completed",
  "Deployed to production",
];

async function graphql(query, variables = {}) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

function App() {
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");

  async function loadReleases() {
    try {
      setError("");

      const data = await graphql(`
        query {
          releases {
            id
            name
            date
            additionalInfo
            completedSteps
            status
          }
        }
      `);

      setReleases(data.releases);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReleases();
  }, []);

  async function createRelease(e) {
    e.preventDefault();

    if (!name.trim() || !date) {
      setError("Release name and date are required.");
      return;
    }

    try {
      await graphql(
        `
          mutation CreateRelease(
            $name: String!
            $date: String!
            $additionalInfo: String
          ) {
            createRelease(
              name: $name
              date: $date
              additionalInfo: $additionalInfo
            ) {
              id
              name
              date
              additionalInfo
              completedSteps
              status
            }
          }
        `,
        {
          name,
          date: new Date(date).toISOString(),
          additionalInfo,
        }
      );

      setName("");
      setDate("");
      setAdditionalInfo("");
      setShowForm(false);
      await loadReleases();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleStep(releaseId, stepIndex, completed) {
    try {
      await graphql(
        `
          mutation ToggleStep(
            $releaseId: ID!
            $stepIndex: Int!
            $completed: Boolean!
          ) {
            toggleStep(
              releaseId: $releaseId
              stepIndex: $stepIndex
              completed: $completed
            ) {
              id
              completedSteps
              status
            }
          }
        `,
        {
          releaseId,
          stepIndex,
          completed,
        }
      );

      await loadReleases();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteRelease(id) {
    if (!window.confirm("Delete this release?")) return;

    try {
      await graphql(
        `
          mutation DeleteRelease($id: ID!) {
            deleteRelease(id: $id)
          }
        `,
        { id }
      );

      await loadReleases();
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateInfo(id, info) {
    try {
      await graphql(
        `
          mutation UpdateRelease(
            $id: ID!
            $additionalInfo: String
          ) {
            updateRelease(
              id: $id
              additionalInfo: $additionalInfo
            ) {
              id
              additionalInfo
            }
          }
        `,
        {
          id,
          additionalInfo: info,
        }
      );

      await loadReleases();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Release Checklist</h1>
          <p>Track your releases from planning to production.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowForm(!showForm)}
        >
          + New Release
        </button>
      </header>

      {error && <div className="error">{error}</div>}

      {showForm && (
        <form className="release-form" onSubmit={createRelease}>
          <h2>Create Release</h2>

          <label>Release Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Version 2.1.0"
          />

          <label>Date *</label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label>Additional Information</label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Add notes about this release..."
          />

          <div className="form-actions">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>

            <button type="submit" className="primary-btn">
              Create Release
            </button>
          </div>
        </form>
      )}

      <main>
        {loading ? (
          <p>Loading releases...</p>
        ) : releases.length === 0 ? (
          <div className="empty">
            <h2>No releases yet</h2>
            <p>Create your first release to start tracking the checklist.</p>
          </div>
        ) : (
          <div className="release-list">
            {releases.map((release) => (
              <ReleaseCard
                key={release.id}
                release={release}
                onToggle={toggleStep}
                onDelete={deleteRelease}
                onUpdateInfo={updateInfo}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ReleaseCard({
  release,
  onToggle,
  onDelete,
  onUpdateInfo,
}) {
  const completed = release.completedSteps || [];
  const progress = Math.round(
    (completed.length / CHECKLIST.length) * 100
  );

  return (
    <section className="release-card">
      <div className="release-top">
        <div>
          <h2>{release.name}</h2>
          <p className="date">
            {new Date(release.date).toLocaleString()}
          </p>
        </div>

        <div className="release-actions">
          <span className={`status ${release.status}`}>
            {release.status}
          </span>

          <button
            className="delete-btn"
            onClick={() => onDelete(release.id)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="progress-area">
        <div className="progress-label">
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>

        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="checklist">
        {CHECKLIST.map((step, index) => (
          <label className="check-item" key={step}>
            <input
              type="checkbox"
              checked={completed.includes(index)}
              onChange={(e) =>
                onToggle(
                  release.id,
                  index,
                  e.target.checked
                )
              }
            />

            <span
              className={
                completed.includes(index) ? "completed" : ""
              }
            >
              {step}
            </span>
          </label>
        ))}
      </div>

      <div className="info">
        <label>Additional Information</label>

        <textarea
          defaultValue={release.additionalInfo || ""}
          placeholder="Add additional information..."
          onBlur={(e) =>
            onUpdateInfo(release.id, e.target.value)
          }
        />
      </div>
    </section>
  );
}

export default App;