
import { useState } from 'react';
import Papa from 'papaparse';
import './App.css';

function App() {
  const [students, setStudents] = useState([]);
  const [threshold, setThreshold] = useState(75);
  const [message, setMessage] = useState('');

  function handleUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data.map((row, index) => {
          const rollNo = (row.rollNo || '').trim();
          const total = Number(row.totalClasses);
          const attended = Number(row.attendedClasses);
          let error = '';

          if (!rollNo) error = 'Missing roll number';
          else if (
            row.totalClasses === '' ||
            row.attendedClasses === '' ||
            !Number.isInteger(total) ||
            !Number.isInteger(attended) ||
            total < 0 ||
            attended < 0
          ) error = 'Invalid class count';
          else if (total === 0) error = 'Total classes must be above 0';
          else if (attended > total) error = 'Attended exceeds total';

          return {
            id: index,
            rollNo,
            total,
            attended,
            error,
            percentage:
              !error ? (attended / total) * 100 : null,
          };
        });

        const seen = new Set();
        rows.forEach((row) => {
          if (row.rollNo && seen.has(row.rollNo)) {
            row.error = 'Duplicate roll number';
            row.percentage = null;
          }
          if (row.rollNo) seen.add(row.rollNo);
        });

        setStudents(rows);
        setMessage(`Processed ${rows.length} rows`);
      },
      error: () => setMessage('Could not read the CSV file'),
    });
  }

  function exportCSV() {
    const data = students.map((s) => ({
      rollNo: s.rollNo,
      totalClasses: s.total,
      attendedClasses: s.attended,
      percentage: s.percentage == null
        ? 'Invalid'
        : s.percentage.toFixed(2),
      status: s.error
        ? s.error
        : s.percentage >= threshold
          ? 'Eligible'
          : 'Below Threshold',
    }));

    const csv = Papa.unparse(data);
    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'attendance-results.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const valid = students.filter((s) => !s.error);
  const eligible = valid.filter(
    (s) => s.percentage >= threshold
  ).length;

  return (
    <main className="container">
      <header>
        <p className="eyebrow">TECH EVENT PORTAL</p>
        <h1>Attendance & Eligibility</h1>
        <p>Upload student attendance and check eligibility.</p>
      </header>

      <section className="panel">
        <label htmlFor="csv">Upload attendance CSV</label>
        <p className="hint">
          Required columns: rollNo, totalClasses, attendedClasses
        </p>
        <input
          id="csv"
          type="file"
          accept=".csv,text/csv"
          onChange={handleUpload}
        />

        <label htmlFor="threshold">
          Eligibility threshold: <strong>{threshold}%</strong>
        </label>
        <input
          id="threshold"
          type="range"
          min="0"
          max="100"
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
        />

        <button onClick={exportCSV} disabled={!students.length}>
          Export results CSV
        </button>
        <p role="status">{message}</p>
      </section>

      {students.length > 0 && (
        <>
          <section className="stats">
            <div className="stat">
              <span>Total rows</span>
              <strong>{students.length}</strong>
            </div>
            <div className="stat">
              <span>Eligible</span>
              <strong>{eligible}</strong>
            </div>
            <div className="stat">
              <span>Invalid rows</span>
              <strong>{students.length - valid.length}</strong>
            </div>
          </section>

          <section className="panel table-wrap">
            <h2>Attendance results</h2>
            <table>
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Attended / Total</th>
                  <th>Percentage</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const status = s.error
                    ? s.error
                    : s.percentage >= threshold
                      ? 'Eligible'
                      : 'Below Threshold';

                  return (
                    <tr key={s.id}>
                      <td>{s.rollNo || '—'}</td>
                      <td>{String(s.attended)} / {String(s.total)}</td>
                      <td>
                        {s.percentage == null
                          ? '—'
                          : `${s.percentage.toFixed(2)}%`}
                      </td>
                      <td>
                        <span className={s.error ? 'invalid' :
                          status === 'Eligible' ? 'eligible' : 'below'}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  );
}

export default App;
