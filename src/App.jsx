
import { useState } from "react";
import * as XLSX from "xlsx";
import "./App.css";

export default function App() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [attendanceLimit, setAttendanceLimit] = useState(75);
  const [cgpaLimit, setCgpaLimit] = useState(6);

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setStudents([]);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, {
          type: "array",
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });

        if (!data.length) {
          setError("Excel sheet is empty.");
          return;
        }

        const normalized = (value) =>
          String(value ?? "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");

        const findColumn = (row, aliases) =>
          Object.keys(row).find((key) =>
            aliases.includes(normalized(key))
          );

        const firstRow = data[0];

        const rollKey = findColumn(firstRow, [
          "rollno", "rollnumber", "roll", "studentid",
        ]);
        const nameKey = findColumn(firstRow, [
          "studentname", "name", "student",
        ]);
        const totalKey = findColumn(firstRow, [
          "totalclasses", "totalclass", "total",
        ]);
        const attendedKey = findColumn(firstRow, [
          "attendedclasses", "classesattended", "attended",
        ]);
        const percentageKey = findColumn(firstRow, [
          "attendancepercentage", "attendancepercent",
          "attendance", "attendancepct",
        ]);
        const cgpaKey = findColumn(firstRow, [
          "cgpa", "cgp", "cumulativegradepointaverage",
        ]);

        if (!rollKey || !cgpaKey ||
            (!percentageKey && (!totalKey || !attendedKey))) {
          setError(
            "Required columns missing. Add Roll No, CGPA, and either Attendance Percentage or Total Classes + Attended Classes."
          );
          return;
        }

        const seen = new Set();

        const results = data.map((row, index) => {
          const rollNo = String(row[rollKey] ?? "").trim();
          const name = nameKey
            ? String(row[nameKey] ?? "").trim()
            : "Student";
          const cgpa = Number(row[cgpaKey]);

          const total = totalKey
            ? Number(row[totalKey])
            : NaN;
          const attended = attendedKey
            ? Number(row[attendedKey])
            : NaN;

          let attendance;

          if (percentageKey) {
            attendance = Number(row[percentageKey]);
            // Excel percentage cells formatted as 85% may
            // be read as 0.85. Convert to 85.
            if (
              typeof row[percentageKey] === "number" &&
              row[percentageKey] > 0 &&
              row[percentageKey] <= 1
            ) {
              attendance *= 100;
            }
          } else if (
            Number.isFinite(total) &&
            Number.isFinite(attended) &&
            total > 0 &&
            attended >= 0 &&
            attended <= total
          ) {
            attendance = (attended / total) * 100;
          } else {
            attendance = NaN;
          }

          let reason = "";

          if (!rollNo) {
            reason = "Missing roll number";
          } else if (seen.has(rollNo)) {
            reason = "Duplicate roll number";
          } else if (
            !Number.isFinite(attendance) ||
            attendance < 0 ||
            attendance > 100
          ) {
            reason = "Invalid attendance data";
          } else if (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10) {
            reason = "Invalid CGPA (expected 0–10)";
          } else if (
            totalKey &&
            attendedKey &&
            (!Number.isFinite(total) ||
              !Number.isFinite(attended) ||
              total <= 0 ||
              attended < 0 ||
              attended > total)
          ) {
            reason = "Invalid class counts";
          }

          if (rollNo) seen.add(rollNo);

          let status = "Eligible";

          if (reason) {
            status = "Invalid Data";
          } else if (
            attendance < attendanceLimit &&
            cgpa < cgpaLimit
          ) {
            status = "Both Low";
          } else if (attendance < attendanceLimit) {
            status = "Attendance Low";
          } else if (cgpa < cgpaLimit) {
            status = "CGPA Low";
          }

          return {
            rollNo,
            name,
            attendance,
            cgpa,
            status,
            reason,
            rowNumber: index + 2,
          };
        });

        setStudents(results);
      } catch {
        setError("Unable to read this file. Please upload a valid Excel file.");
      }
    };

    reader.onerror = () => setError("Unable to read the selected file.");
    reader.readAsArrayBuffer(file);
  }

  function downloadReport() {
    const rows = students.map((s) => ({
      "Roll No": s.rollNo,
      "Student Name": s.name,
      "Attendance Percentage": Number.isFinite(s.attendance)
        ? Number(s.attendance.toFixed(2))
        : "",
      CGPA: Number.isFinite(s.cgpa) ? s.cgpa : "",
      Status: s.status,
      Reason: s.reason,
    }));

    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Eligibility Report");
    XLSX.writeFile(book, "eligibility-report.xlsx");
  }

  const eligibleCount = students.filter(
    (s) => s.status === "Eligible"
  ).length;

  return (
    <main className="eligibility-app">
      <h1>Student Eligibility Checker</h1>
      <p>
        Upload one Excel sheet to check attendance and CGPA eligibility.
      </p>

      <section className="upload-panel">
        <label htmlFor="excel-file">Choose student Excel file</label>
        <input
          id="excel-file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
        />
        <small>Supported files: .xlsx and .xls</small>
      </section>

      <section className="rules-panel">
        <label>
          Minimum Attendance: <strong>{attendanceLimit}%</strong>
          <input
            type="range"
            min="0"
            max="100"
            value={attendanceLimit}
            onChange={(e) =>
              setAttendanceLimit(Number(e.target.value))
            }
          />
        </label>

        <label>
          Minimum CGPA: <strong>{cgpaLimit.toFixed(1)}</strong>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={cgpaLimit}
            onChange={(e) => setCgpaLimit(Number(e.target.value))}
          />
        </label>
      </section>

      {error && <p className="error-message">{error}</p>}

      {students.length > 0 && (
        <section className="results-panel">
          <div className="results-heading">
            <div>
              <h2>Eligibility Results</h2>
              <p>
                {students.length} students · {eligibleCount} eligible
              </p>
            </div>
            <button onClick={downloadReport}>
              Download Excel Report
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Attendance</th>
                  <th>CGPA</th>
                  <th>Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, index) => (
                  <tr key={`${s.rollNo}-${index}`}>
                    <td>{s.rollNo || "—"}</td>
                    <td>{s.name}</td>
                    <td>
                      {Number.isFinite(s.attendance)
                        ? `${s.attendance.toFixed(1)}%`
                        : "—"}
                    </td>
                    <td>
                      {Number.isFinite(s.cgpa) ? s.cgpa : "—"}
                    </td>
                    <td>
                      <span
                        className={
                          s.status === "Eligible"
                            ? "status-eligible"
                            : s.status === "Invalid Data"
                            ? "status-invalid"
                            : "status-ineligible"
                        }
                      >
                        {s.status}
                      </span>
                    </td>
                    <td>{s.reason || s.status === "Eligible"
                      ? s.reason || "Meets both requirements"
                      : s.status === "Both Low"
                      ? "Attendance and CGPA below minimum"
                      : s.status === "Attendance Low"
                      ? "Attendance below minimum"
                      : "CGPA below minimum"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
