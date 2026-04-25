import React, { useState } from 'react';
import axios from 'axios';
import { Upload, Database, ShieldAlert, BarChart2, CheckCircle, Loader, Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// API base URL
const API_URL = 'http://127.0.0.up:8000/api/dataset'; // We will use localhost

export default function App() {
  const [step, setStep] = useState<'upload' | 'configure' | 'analyzing' | 'dashboard' | 'mitigation'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<any>(null);
  
  const [targetCol, setTargetCol] = useState('');
  const [sensitiveCol, setSensitiveCol] = useState('');
  
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [mitigationStrategies, setMitigationStrategies] = useState<string[]>([]);
  const [isMitigating, setIsMitigating] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setStep('analyzing');
      const res = await axios.post('http://127.0.0.1:8000/api/dataset/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDatasetInfo(res.data);
      setStep('configure');
    } catch (e: any) {
      alert("Error uploading file: " + (e.response?.data?.detail || e.message));
      setStep('upload');
    }
  };

  const startAnalysis = async () => {
    if (!targetCol || !sensitiveCol) {
      alert("Please select target and sensitive columns.");
      return;
    }
    
    try {
      setStep('analyzing');
      const res = await axios.post('http://127.0.0.1:8000/api/dataset/analyze', {
        dataset_id: "current_dataset",
        target_column: targetCol,
        sensitive_column: sensitiveCol
      });
      setAnalysisData(res.data);
      setStep('dashboard');
    } catch (e: any) {
      alert("Error analyzing: " + (e.response?.data?.detail || e.message));
      setStep('configure');
    }
  };

  const applyMitigation = async () => {
    if (mitigationStrategies.length === 0) {
      alert("Select at least one strategy.");
      return;
    }
    
    try {
      setIsMitigating(true);
      const res = await axios.post('http://127.0.0.1:8000/api/dataset/mitigate', {
        dataset_id: "current_dataset",
        target_column: targetCol,
        sensitive_column: sensitiveCol,
        strategies: mitigationStrategies
      });
      setAnalysisData(res.data);
      alert("Mitigation applied successfully!");
      setStep('dashboard'); // Stay on dashboard to see new stats
    } catch (e: any) {
      alert("Error mitigating: " + (e.response?.data?.detail || e.message));
    } finally {
      setIsMitigating(false);
    }
  };

  const downloadDataset = () => {
    window.open(`http://127.0.0.1:8000/api/dataset/download/current_dataset_mitigated`, "_blank");
  };

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>FairData AI</h1>
          <p>Dataset Bias Detection & Mitigation Platform</p>
        </div>
        <div>
          {step === 'dashboard' && analysisData?.mitigated_dataset_id && (
             <button className="btn btn-success" onClick={downloadDataset}>
               <Download size={18} /> Download Clean Dataset
             </button>
          )}
        </div>
      </header>

      {step === 'upload' && (
        <div className="card">
          <div className="upload-zone" onClick={() => document.getElementById('fileUpload')?.click()}>
            <Upload size={48} className="upload-icon" />
            <h2>Upload your dataset</h2>
            <p>Drag and drop or click to select CSV, JSON, or Excel files</p>
            <input 
              type="file" 
              id="fileUpload" 
              style={{ display: 'none' }} 
              accept=".csv,.xlsx,.json"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      )}

      {step === 'analyzing' && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <Loader size={48} className="spin upload-icon" />
          <h2>Processing Data...</h2>
          <p>Running fairness metrics and detecting biases</p>
        </div>
      )}

      {step === 'configure' && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Database size={48} className="upload-icon" />
          <h2>Configure Analysis</h2>
          <p>We found {datasetInfo?.columns} columns in your dataset.</p>
          
          <div className="select-group">
            <div>
              <label>Target Column (Outcome)</label>
              <select className="select-input" value={targetCol} onChange={e => setTargetCol(e.target.value)}>
                <option value="">-- Select Target --</option>
                {datasetInfo?.columns_list.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Sensitive Column (Protected Attribute)</label>
              <select className="select-input" value={sensitiveCol} onChange={e => setSensitiveCol(e.target.value)}>
                <option value="">-- Select Sensitive --</option>
                {datasetInfo?.columns_list.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            
            <button className="btn" style={{ marginTop: '1rem', justifyContent: 'center' }} onClick={startAnalysis}>
              <BarChart2 size={18} /> Start Analysis
            </button>
          </div>
        </div>
      )}

      {step === 'dashboard' && analysisData && (
        <div className="dashboard-grid">
          {/* Top stats */}
          <div className="col-span-3 card">
             <div className="stat-label">Total Rows</div>
             <div className="stat-value">{analysisData.overview.total_rows.toLocaleString()}</div>
          </div>
          <div className="col-span-3 card">
             <div className="stat-label">Total Columns</div>
             <div className="stat-value">{analysisData.overview.total_cols}</div>
          </div>
          <div className="col-span-6 card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div>
                <div className="stat-label">Detected Biases</div>
                <div className="stat-value" style={{ color: analysisData.biases.length > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                   {analysisData.biases.length}
                </div>
             </div>
             <div>
                <button className="btn btn-secondary" onClick={() => document.getElementById('mitigation-section')?.scrollIntoView({behavior: 'smooth'})}>
                  Fix Biases
                </button>
             </div>
          </div>

          {/* Fairness score */}
          <div className="col-span-4 card">
            <h3 style={{ marginTop: 0 }}>Fairness Score</h3>
            <div className="fairness-score-container">
              <div className={`score-circle ${analysisData.fairness?.score > 90 ? 'score-good' : analysisData.fairness?.score > 70 ? 'score-medium' : 'score-bad'}`}>
                {analysisData.fairness ? Math.round(analysisData.fairness.score) : 'N/A'}
              </div>
              <div className="stat-label">
                 Risk Level: <span className={`badge badge-${(analysisData.fairness?.risk_level || 'unknown').toLowerCase()}`}>{analysisData.fairness?.risk_level || 'N/A'}</span>
              </div>
              <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                 Demographic Parity Diff: {analysisData.fairness?.demographic_parity_diff} <br/>
                 Disparate Impact: {analysisData.fairness?.disparate_impact_ratio}
              </p>
            </div>
          </div>

          {/* Biases Table */}
          <div className="col-span-8 card table-container">
             <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
               <ShieldAlert size={20} color="var(--warning)" /> Detected Biases
             </h3>
             {analysisData.biases.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--accent)' }}>
                 <CheckCircle size={40} style={{ marginBottom: '1rem' }} />
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
                       <td><span className={`badge badge-${b.severity.toLowerCase()}`}>{b.severity}</span></td>
                       <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{b.explanation}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
          </div>

          {/* Dummy Charts to illustrate visually */}
          <div className="col-span-12 card">
            <h3 style={{ marginTop: 0 }}>Group Demographics ({sensitiveCol})</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                 {/* Recharts simple bar chart of base rates */}
                 <BarChart data={Object.entries(analysisData.fairness?.group_rates || {}).map(([k,v]) => ({ name: k, value: (v as number)*100 }))}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                   <XAxis dataKey="name" stroke="#94a3b8" />
                   <YAxis dataKey="value" stroke="#94a3b8" label={{ value: 'Positive Rate %', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                   <RechartsTooltip contentStyle={{ backgroundColor: '#1b1e24', border: '1px solid #334155' }} />
                   <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mitigation Section */}
          <div id="mitigation-section" className="col-span-12 card" style={{ marginTop: '2rem' }}>
             <h3 style={{ marginTop: 0 }}>Bias Mitigation (Fix Engine)</h3>
             <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Select techniques to balance data and resolve detected biases.
             </p>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                   <h4>Data Sampling</h4>
                   <div className="checkbox-group">
                      <input type="checkbox" id="m1" onChange={e => {
                         const v = 'Undersampling';
                         setMitigationStrategies(prev => e.target.checked ? [...prev, v] : prev.filter(x => x !== v));
                      }}/>
                      <label htmlFor="m1">Undersampling (Majority Class)</label>
                   </div>
                   <div className="checkbox-group">
                      <input type="checkbox" id="m2" onChange={e => {
                         const v = 'Oversampling';
                         setMitigationStrategies(prev => e.target.checked ? [...prev, v] : prev.filter(x => x !== v));
                      }}/>
                      <label htmlFor="m2">Oversampling (Minority Class)</label>
                   </div>
                </div>
                
                <div style={{ background: 'var(--bg-dark)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                   <h4>Feature Adjustment</h4>
                   <div className="checkbox-group">
                      <input type="checkbox" id="m3" onChange={e => {
                         const v = 'Drop Proxy Features';
                         setMitigationStrategies(prev => e.target.checked ? [...prev, v] : prev.filter(x => x !== v));
                      }}/>
                      <label htmlFor="m3">Drop Proxy Features</label>
                   </div>
                   <div className="checkbox-group">
                      <input type="checkbox" id="m4" onChange={e => {
                         const v = 'Outlier Removal';
                         setMitigationStrategies(prev => e.target.checked ? [...prev, v] : prev.filter(x => x !== v));
                      }}/>
                      <label htmlFor="m4">Outlier Removal</label>
                   </div>
                </div>
             </div>
             
             <button className="btn" onClick={applyMitigation} disabled={isMitigating}>
                {isMitigating ? <><Loader size={18} className="spin" /> Applying fixes...</> : 'Apply Selected Fixes'}
             </button>
          </div>
          
        </div>
      )}
    </div>
  );
}
