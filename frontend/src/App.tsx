import React, { useState } from "react";
import axios from "axios";
import {
  Upload,
  Database,
  ShieldAlert,
  BarChart2,
  CheckCircle,
  Loader,
  Download,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Activity,
} from "lucide-react";


const API_BASE =
  "https://bias-detection-in-ai-models-and-dataset.onrender.com/api";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "dataset" | "model">(
    "home",
  );

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setCurrentView("home")}>
          <ShieldCheck size={28} color="var(--primary)" />
          FairData AI
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentView === "home" ? "active" : ""}`}
            onClick={() => setCurrentView("home")}
          >
            Home
          </button>
          <button
            className={`nav-link ${currentView === "dataset" ? "active" : ""}`}
            onClick={() => setCurrentView("dataset")}
          >
            Dataset Bias
          </button>
          <button
            className={`nav-link ${currentView === "model" ? "active" : ""}`}
            onClick={() => setCurrentView("model")}
          >
            Model Bias
          </button>
        </div>
      </nav>

      <div className="app-container">
        {currentView === "home" && <HomeView setView={setCurrentView} />}
        {currentView === "dataset" && <DatasetBiasView />}
        {currentView === "model" && <ModelBiasView />}
      </div>
    </>
  );
}

function HomeView({
  setView,
}: {
  setView: (view: "dataset" | "model") => void;
}) {
  return (
    <div className="hero-section">
      <div className="hero-badge">Next-Gen Fairness Platform</div>
      <h1 className="hero-title">
        Detect & Mitigate <span>AI Biases</span> in Seconds
      </h1>
      <p className="hero-subtitle">
        Ensure your machine learning models and datasets are fair, unbiased, and
        compliant with modern ethical standards. Run automated audits and apply
        fixes with a single click.
      </p>

      <div className="hero-buttons">
        <button className="btn btn-large" onClick={() => setView("dataset")}>
          <Database size={20} /> Analyze Dataset
        </button>
        <button
          className="btn btn-secondary btn-large"
          onClick={() => setView("model")}
        >
          <Cpu size={20} /> Audit AI Model
        </button>
      </div>

      <div
        style={{
          marginTop: "5rem",
          display: "flex",
          gap: "2rem",
          justifyContent: "center",
        }}
      >
        <div
          className="card"
          style={{
            flex: 1,
            textAlign: "left",
            background: "rgba(27, 30, 36, 0.4)",
          }}
        >
          <Activity
            size={32}
            color="var(--accent)"
            style={{ marginBottom: "1rem" }}
          />
          <h3 style={{ marginTop: 0 }}>Dataset Audits</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Upload CSV/JSON files to detect demographic disparities and apply
            balancing techniques automatically.
          </p>
        </div>
        <div
          className="card"
          style={{
            flex: 1,
            textAlign: "left",
            background: "rgba(27, 30, 36, 0.4)",
          }}
        >
          <ShieldAlert
            size={32}
            color="var(--warning)"
            style={{ marginBottom: "1rem" }}
          />
          <h3 style={{ marginTop: 0 }}>Model Evaluation</h3>
          <p style={{ color: "var(--text-muted)" }}>
            Provide an endpoint or URL for your AI model to simulate fairness
            stress tests and get a comprehensive scorecard.
          </p>
        </div>
      </div>
    </div>
  );
}

function DatasetBiasView() {
  const [step, setStep] = useState<
    "upload" | "configure" | "analyzing" | "dashboard" | "mitigation"
  >("upload");
  const [_file, setFile] = useState<File | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  const [targetCol, setTargetCol] = useState("");
  const [sensitiveCol, setSensitiveCol] = useState("");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [mitigationStrategies, setMitigationStrategies] = useState<string[]>(
    [],
  );
  const [isMitigating, setIsMitigating] = useState(false);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setStep("analyzing");
      const res = await axios.post(`${API_BASE}/dataset/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDatasetInfo(res.data);
      setStep("configure");
    } catch (e: any) {
      alert("Error uploading file: " + (e.response?.data?.detail || e.message));
      setStep("upload");
    }
  };

  const startAnalysis = async () => {
    if (!targetCol || !sensitiveCol) {
      alert("Please select target and sensitive columns.");
      return;
    }

    try {
      setStep("analyzing");
      const res = await axios.post(`${API_BASE}/dataset/analyze`, {
        dataset_id: "current_dataset",
        target_column: targetCol,
        sensitive_column: sensitiveCol,
      });
      setAnalysisData(res.data);
      setStep("dashboard");
    } catch (e: any) {
      alert("Error analyzing: " + (e.response?.data?.detail || e.message));
      setStep("configure");
    }
  };

  const applyMitigation = async () => {
    if (mitigationStrategies.length === 0) {
      alert("Select at least one strategy.");
      return;
    }

    try {
      setIsMitigating(true);
      const res = await axios.post(`${API_BASE}/dataset/mitigate`, {
        dataset_id: "current_dataset",
        target_column: targetCol,
        sensitive_column: sensitiveCol,
        strategies: mitigationStrategies,
      });
      setAnalysisData(res.data);
      alert("Mitigation applied successfully!");
      setStep("dashboard");
    } catch (e: any) {
      alert("Error mitigating: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsMitigating(false);
    }
  };

  const downloadDataset = () => {
    window.open(
      `${API_BASE}/dataset/download/current_dataset_mitigated`,
      "_blank",
    );
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <header
        className="header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2>Dataset Bias Detection</h2>
          <p>Analyze and mitigate biases in your raw data.</p>
        </div>
        <div>
          {step === "dashboard" && analysisData?.mitigated_dataset_id && (
            <button className="btn btn-success" onClick={downloadDataset}>
              <Download size={18} /> Download Clean Dataset
            </button>
          )}
        </div>
      </header>

      {step === "upload" && (
        <div className="card">
          <div
            className="upload-zone"
            onClick={() => document.getElementById("fileUpload")?.click()}
          >
            <Upload size={48} className="upload-icon" />
            <h2>Upload your dataset</h2>
            <p>Drag and drop or click to select CSV, JSON, or Excel files</p>
            <input
              type="file"
              id="fileUpload"
              style={{ display: "none" }}
              accept=".csv,.xlsx,.json"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      )}

      {step === "analyzing" && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "4rem 2rem" }}
        >
          <Loader size={48} className="spin upload-icon" />
          <h2>Processing Data...</h2>
          <p>Running fairness metrics and detecting biases</p>
        </div>
      )}

      {step === "configure" && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "3rem 2rem" }}
        >
          <Database size={48} className="upload-icon" />
          <h2>Configure Analysis</h2>
          <p>We found {datasetInfo?.columns} columns in your dataset.</p>

          <div className="select-group">
            <div>
              <label>Target Column (Outcome)</label>
              <select
                className="select-input"
                value={targetCol}
                onChange={(e) => setTargetCol(e.target.value)}
              >
                <option value="">-- Select Target --</option>
                {datasetInfo?.columns_list.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Sensitive Column (Protected Attribute)</label>
              <select
                className="select-input"
                value={sensitiveCol}
                onChange={(e) => setSensitiveCol(e.target.value)}
              >
                <option value="">-- Select Sensitive --</option>
                {datasetInfo?.columns_list.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn"
              style={{ marginTop: "1rem", justifyContent: "center" }}
              onClick={startAnalysis}
            >
              <BarChart2 size={18} /> Start Analysis
            </button>
          </div>
        </div>
      )}

      {step === "dashboard" && analysisData && (
        <div className="dashboard-grid">
          {/* Top stats */}
          <div className="col-span-3 card">
            <div className="stat-label">Total Rows</div>
            <div className="stat-value">
              {analysisData.overview.total_rows.toLocaleString()}
            </div>
          </div>
          <div className="col-span-3 card">
            <div className="stat-label">Total Columns</div>
            <div className="stat-value">{analysisData.overview.total_cols}</div>
          </div>
          <div
            className="col-span-6 card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div className="stat-label">Detected Biases</div>
              <div
                className="stat-value"
                style={{
                  color:
                    analysisData.biases.length > 0
                      ? "var(--danger)"
                      : "var(--accent)",
                }}
              >
                {analysisData.biases.length}
              </div>
            </div>
            <div>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  document
                    .getElementById("mitigation-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Fix Biases
              </button>
            </div>
          </div>

          {/* Fairness score */}
          <div className="col-span-4 card">
            <h3 style={{ marginTop: 0 }}>Fairness Score</h3>
            <div className="fairness-score-container">
              <div
                className={`score-circle ${analysisData.fairness?.score > 90 ? "score-good" : analysisData.fairness?.score > 70 ? "score-medium" : "score-bad"}`}
              >
                {analysisData.fairness
                  ? Math.round(analysisData.fairness.score)
                  : "N/A"}
              </div>
              <div className="stat-label">
                Risk Level:{" "}
                <span
                  className={`badge badge-${(analysisData.fairness?.risk_level || "unknown").toLowerCase()}`}
                >
                  {analysisData.fairness?.risk_level || "N/A"}
                </span>
              </div>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  marginTop: "1rem",
                }}
              >
                Demographic Parity Diff:{" "}
                {analysisData.fairness?.demographic_parity_diff} <br />
                Disparate Impact:{" "}
                {analysisData.fairness?.disparate_impact_ratio}
              </p>
            </div>
          </div>

          {/* Biases Table */}
          <div className="col-span-8 card table-container">
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ShieldAlert size={20} color="var(--warning)" /> Detected Biases
            </h3>
            {analysisData.biases.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 0",
                  color: "var(--accent)",
                }}
              >
                <CheckCircle size={40} style={{ marginBottom: "1rem" }} />
                <p>No major biases detected.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Bias Type</th>
                    <th>Severity</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.biases.map((b: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{b.type}</td>
                      <td>
                        <span
                          className={`badge badge-${b.severity.toLowerCase()}`}
                        >
                          {b.severity}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {b.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Mitigation Section */}
          <div
            id="mitigation-section"
            className="col-span-12 card"
            style={{ marginTop: "2rem" }}
          >
            <h3 style={{ marginTop: 0 }}>Bias Mitigation (Fix Engine)</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Select techniques to balance data and resolve detected biases.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
                marginBottom: "2rem",
              }}
            >
              <div
                style={{
                  background: "var(--bg-dark)",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h4>Data Sampling</h4>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="m1"
                    onChange={(e) => {
                      const v = "Undersampling";
                      setMitigationStrategies((prev) =>
                        e.target.checked
                          ? [...prev, v]
                          : prev.filter((x) => x !== v),
                      );
                    }}
                  />
                  <label htmlFor="m1">Undersampling (Majority Class)</label>
                </div>
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="m2"
                    onChange={(e) => {
                      const v = "Oversampling";
                      setMitigationStrategies((prev) =>
                        e.target.checked
                          ? [...prev, v]
                          : prev.filter((x) => x !== v),
                      );
                    }}
                  />
                  <label htmlFor="m2">Oversampling (Minority Class)</label>
                </div>
              </div>
            </div>

            <button
              className="btn"
              onClick={applyMitigation}
              disabled={isMitigating}
            >
              {isMitigating ? (
                <>
                  <Loader size={18} className="spin" /> Applying fixes...
                </>
              ) : (
                "Apply Selected Fixes"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelBiasView() {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const startScan = async () => {
    if (!url.startsWith("http")) {
      alert("Please enter a valid URL starting with http:// or https://");
      return;
    }

    setIsScanning(true);
    setResult(null);
    setScanLogs([
      "Initializing secure connection...",
      `Connecting to ${url}...`,
    ]);

    // Simulate real-time logs
    let logCount = 0;
    const interval = setInterval(() => {
      logCount++;
      if (logCount === 1)
        setScanLogs((l) => [...l, "Sending fairness test prompts (1/3)..."]);
      if (logCount === 2)
        setScanLogs((l) => [
          ...l,
          "Analyzing text generation sentiment (2/3)...",
        ]);
      if (logCount === 3)
        setScanLogs((l) => [
          ...l,
          "Computing counterfactual fairness metrics (3/3)...",
        ]);
    }, 600);

    try {
      const res = await axios.post(`${API_BASE}/model/analyze-url`, {
        model_url: url,
      });
      clearInterval(interval);
      setScanLogs((l) => [...l, "Scan complete."]);
      setResult(res.data);
    } catch (e: any) {
      clearInterval(interval);
      setScanLogs((l) => [
        ...l,
        "Error during scan: " + (e.response?.data?.detail || e.message),
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease-out" }}>
      <header className="header">
        <h2>AI Model Bias Audit</h2>
        <p>Test an external AI model by providing its URL/Endpoint.</p>
      </header>

      {!result && (
        <div
          className="card"
          style={{ textAlign: "center", padding: "4rem 2rem" }}
        >
          <div className="url-input-container">
            <h3
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <Cpu size={24} color="var(--primary)" /> Endpoint URL
            </h3>
            <div style={{ display: "flex", gap: "1rem" }}>
              <input
                type="text"
                className="url-input"
                placeholder="https://api.huggingface.co/models/your-model"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isScanning}
              />
              <button
                className="btn"
                onClick={startScan}
                disabled={isScanning || !url}
              >
                {isScanning ? (
                  <Loader className="spin" size={20} />
                ) : (
                  <ArrowRight size={20} />
                )}
              </button>
            </div>

            {isScanning && (
              <div className="mock-terminal">
                {scanLogs.map((log, i) => (
                  <div
                    key={i}
                    className="pulse-animation"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  >
                    &gt; {log}
                  </div>
                ))}
                <span className="pulse-animation">_</span>
              </div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div
          className="dashboard-grid"
          style={{ animation: "fadeIn 0.5s ease-out" }}
        >
          <div
            className="col-span-12 card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div className="stat-label">Scanned Endpoint</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.1rem",
                  marginTop: "0.5rem",
                }}
              >
                {result.url_scanned}
              </div>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setResult(null)}
            >
              New Scan
            </button>
          </div>

          <div className="col-span-4 card">
            <h3 style={{ marginTop: 0 }}>Model Fairness Score</h3>
            <div className="fairness-score-container">
              <div
                className={`score-circle ${result.score > 90 ? "score-good" : result.score > 70 ? "score-medium" : "score-bad"}`}
              >
                {result.score}
              </div>
              <div className="stat-label">
                Risk Level:{" "}
                <span
                  className={`badge badge-${result.risk_level.toLowerCase()}`}
                >
                  {result.risk_level}
                </span>
              </div>
              <p
                style={{
                  textAlign: "center",
                  fontSize: "0.9rem",
                  color: "var(--text-muted)",
                  marginTop: "1rem",
                }}
              >
                Prompts Evaluated: {result.prompts_tested}
              </p>
            </div>
          </div>

          <div className="col-span-8 card table-container">
            <h3
              style={{
                marginTop: 0,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ShieldAlert size={20} color="var(--warning)" /> Audit Findings
            </h3>
            {result.biases.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem 0",
                  color: "var(--accent)",
                }}
              >
                <CheckCircle size={40} style={{ marginBottom: "1rem" }} />
                <p>No systematic biases detected in model outputs.</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Detected Bias</th>
                    <th>Severity</th>
                    <th>Context/Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {result.biases.map((b: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{b.type}</td>
                      <td>
                        <span
                          className={`badge badge-${b.severity.toLowerCase()}`}
                        >
                          {b.severity}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {b.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
