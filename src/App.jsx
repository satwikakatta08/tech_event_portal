
import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./App.css";

export default function App() {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const [attendanceLimit, setAttendanceLimit] = useState(75);
  const [cgpaLimit, setCgpaLimit] = useState(6);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");

  function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setStudents([]);

    const reader = new FileReader();

    reader.onload = async (e) => {
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
          "rollno",
          "rollnumber",
          "roll",
          "studentid",
        ]);

        const nameKey = findColumn(firstRow, [
          "studentname",
          "name",
          "student",
        ]);

        const totalKey = findColumn(firstRow, [
          "totalclasses",
          "totalclass",
          "total",
        ]);

        const attendedKey = findColumn(firstRow, [
          "attendedclasses",
          "classesattended",
          "attended",
        ]);

        const percentageKey = findColumn(firstRow, [
          "attendancepercentage",
          "attendancepercent",
          "attendance",
          "attendancepct",
        ]);

        const cgpaKey = findColumn(firstRow, [
          "cgpa",
          "cgp",
          "cumulativegradepointaverage",
        ]);

        if (
          !rollKey ||
          !cgpaKey ||
          (!percentageKey && (!totalKey || !attendedKey))
        ) {
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

          const total = totalKey ? Number(row[totalKey]) : NaN;
          const attended = attendedKey
            ? Number(row[attendedKey])
            : NaN;

          let attendance;

          if (percentageKey) {
            attendance = Number(row[percentageKey]);

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
          } else if (
            !Number.isFinite(cgpa) ||
            cgpa < 0 ||
            cgpa > 10
          ) {
            reason = "Invalid CGPA (expected 0-10)";
          } else if (
            totalKey &&
            attendedKey &&
            (
              !Number.isFinite(total) ||
              !Number.isFinite(attended) ||
              total <= 0 ||
              attended < 0 ||
              attended > total
            )
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

try {
  const response = await fetch("http://localhost:5000/api/students", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(results),
  });

  if (!response.ok) {
    setError("Failed to save student data to backend.");
  }
} catch {
  setError("Backend connection failed. Please start the backend.");
}
      } catch {
        setError(
          "Unable to read this file. Please upload a valid Excel file."
        );
      }
    };

    reader.onerror = () =>
      setError("Unable to read the selected file.");

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

    XLSX.utils.book_append_sheet(
      book,
      sheet,
      "Eligibility Report"
    );

    XLSX.writeFile(book, "eligibility-report.xlsx");
  }

  function downloadPermissionLetter() {
    const eligibleStudents = students.filter(
      (s) => s.status === "Eligible" && s.rollNo.trim() !== ""
    );

    if (eligibleStudents.length === 0) {
      setError("There are no eligible students for the permission letter.");
      return;
    }

    setError("");

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 22;

    const event = eventName.trim() || "________________";
    const date = eventDate
      ? new Date(`${eventDate}T00:00:00`).toLocaleDateString("en-GB")
      : "________________";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("REQUEST FOR EVENT PARTICIPATION", pageWidth / 2, y, {
      align: "center",
    });

    y += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(`Event Name: ${event}`, margin, y);
    y += 8;
    doc.text(`Event Date: ${date}`, margin, y);
    y += 8;
    doc.text(
      `Date of Issue: ${new Date().toLocaleDateString("en-GB")}`,
      margin,
      y
    );

    y += 14;
    doc.text("To", margin, y);
    y += 7;
    doc.text("The Head of the Department", margin, y);
    y += 9;
    doc.text("Respected Sir/Madam,", margin, y);

    y += 9;

    const description =
      `We kindly request your permission to allow the following eligible ` +
      `students to participate in ${event}, scheduled to be held on ${date}. ` +
      `The students have been evaluated based on the prescribed eligibility ` +
      `criteria of a minimum attendance of ${attendanceLimit}% and a minimum ` +
      `CGPA of ${cgpaLimit.toFixed(1)}. The students listed below satisfy ` +
      `these requirements and are recommended for participation. We request ` +
      `you to kindly grant them permission to attend the event. They will ` +
      `follow the institution's rules and regulations and maintain their ` +
      `academic responsibilities.`;

    const descriptionLines = doc.splitTextToSize(
      description,
      contentWidth
    );

    descriptionLines.forEach((line) => {
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 22;
      }

      doc.text(line, margin, y);
      y += 6;
    });

    y += 7;

    if (y > pageHeight - 35) {
      doc.addPage();
      y = 22;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("List of Eligible Students", margin, y);
    y += 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    eligibleStudents.forEach((s, index) => {
      const studentLine = `${index + 1}. ${s.rollNo} - ${s.name}`;
      const lines = doc.splitTextToSize(studentLine, contentWidth - 5);

      if (y + lines.length * 6 > pageHeight - 45) {
        doc.addPage();
        y = 22;
      }

      doc.text(lines, margin + 3, y);
      y += lines.length * 6 + 2;
    });

    if (y + 38 > pageHeight - 10) {
      doc.addPage();
      y = 22;
    }

    y += 7;
    doc.text("Thank you for your consideration.", margin, y);
    y += 8;
    doc.text("Yours sincerely,", margin, y);
    y += 16;

    doc.setFont("helvetica", "bold");
    doc.text("Head of the Department (HOD)", margin, y);
    y += 9;

    doc.setFont("helvetica", "normal");
    doc.text("Signature: __________________________", margin, y);
    y += 8;
    doc.text("Date: __________________", margin, y);

    const safeName = (eventName.trim() || "event")
      .replace(/[^a-z0-9_-]/gi, "_")
      .slice(0, 50);

    doc.save(`${safeName}-permission-letter.pdf`);
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
        <label htmlFor="excel-file">
          Choose student Excel file
        </label>
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
            onChange={(e) =>
              setCgpaLimit(Number(e.target.value))
            }
          />
        </label>
      </section>

      {students.length > 0 && (
        <section className="upload-panel">
          <h2>Event Permission Letter</h2>

          <label htmlFor="event-name">Event Name</label>
          <input
            id="event-name"
            type="text"
            placeholder="Enter technical event name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
          />

          <label htmlFor="event-date">Event Date</label>
          <input
            id="event-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />

          <small>
            The PDF includes only eligible students and has a
            separate HOD signature column.
          </small>
        </section>
      )}

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

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <button onClick={downloadReport}>
                Download Excel Report
              </button>

              <button
                onClick={downloadPermissionLetter}
                disabled={eligibleCount === 0}
              >
                Download Permission Letter (PDF)
              </button>
            </div>
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
                {students.map((s, index) => {
                  let reasonText = s.reason;

                  if (!reasonText) {
                    if (s.status === "Eligible") {
                      reasonText = "Meets both requirements";
                    } else if (s.status === "Both Low") {
                      reasonText = "Attendance and CGPA below minimum";
                    } else if (s.status === "Attendance Low") {
                      reasonText = "Attendance below minimum";
                    } else {
                      reasonText = "CGPA below minimum";
                    }
                  }

                  return (
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
                      <td>{reasonText}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {eligibleCount === 0 && (
            <p>No eligible students available for a permission letter.</p>
          )}
        </section>
      )}
    </main>
  );
}
