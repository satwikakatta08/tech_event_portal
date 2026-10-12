
/* =========================================
   EVENTPORTAL - PROCTOR DASHBOARD
========================================= */

/* 1. DEFAULT STUDENT REQUESTS */

const defaultRequests = [
  {
    id: 1,
    student: "Ananya Reddy",
    rollNo: "25EU02011",
    event: "AI Innovation Hackathon",
    date: "2026-11-12",
    mode: "Offline",
    status: "Pending",
    attendanceSubmitted: false,
    attendanceProofStatus: "Pending Review"
  },
  {
    id: 2,
    student: "Rahul Sharma",
    rollNo: "25EU02024",
    event: "Web Development Workshop",
    date: "2026-11-18",
    mode: "Online",
    status: "Pending",
    attendanceSubmitted: false,
    attendanceProofStatus: "Pending Review"
  },
  {
    id: 3,
    student: "Priya Kumar",
    rollNo: "25EU02035",
    event: "Cloud Computing Conference",
    date: "2026-11-25",
    mode: "Offline",
    status: "Approved",
    attendanceSubmitted: true,
    attendanceProofStatus: "Pending Review"
  },
  {
    id: 4,
    student: "Arjun Rao",
    rollNo: "25EU02042",
    event: "Cybersecurity Challenge",
    date: "2026-12-02",
    mode: "Online",
    status: "Rejected",
    attendanceSubmitted: false,
    attendanceProofStatus: "Pending Review"
  }
];


/* 2. LOAD SAVED REQUESTS */

function loadRequests() {
  try {
    const savedData = localStorage.getItem("proctorRequests");

    if (savedData !== null) {
      const parsedData = JSON.parse(savedData);

      const validData =
        Array.isArray(parsedData) &&
        parsedData.every(request =>
          request &&
          Number.isInteger(request.id) &&
          typeof request.student === "string" &&
          typeof request.rollNo === "string" &&
          typeof request.event === "string" &&
          ["Pending", "Approved", "Rejected"].includes(request.status) &&
          typeof request.attendanceSubmitted === "boolean"
        );

      if (validData) {
        // Add the new property to previously saved requests.
        return parsedData.map(request => ({
          ...request,
          attendanceProofStatus:
            request.attendanceProofStatus || "Pending Review"
        }));
      }
    }
  } catch (error) {
    console.error("Error loading saved requests:", error);
  }

  return defaultRequests.map(request => ({ ...request }));
}

let requests = loadRequests();


/* 3. GET HTML ELEMENTS */

const requestList = document.getElementById("requestList");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const feedback = document.getElementById("feedback");
const attendanceList = document.getElementById("attendanceList");


/* 4. SAVE REQUESTS IN BROWSER */

function saveRequests() {
  try {
    localStorage.setItem(
      "proctorRequests",
      JSON.stringify(requests)
    );

    return true;
  } catch (error) {
    console.error("Error saving requests:", error);

    feedback.textContent =
      "Unable to save changes. Please check browser storage.";

    return false;
  }
}


/* 5. DISPLAY AND FILTER PERMISSION REQUESTS */

function renderRequests() {
  const searchText = searchInput.value.toLowerCase().trim();
  const selectedStatus = statusFilter.value;

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.student.toLowerCase().includes(searchText) ||
      request.rollNo.toLowerCase().includes(searchText) ||
      request.event.toLowerCase().includes(searchText);

    const matchesStatus =
      selectedStatus === "All" ||
      request.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  if (filteredRequests.length === 0) {
    requestList.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          No matching requests found.
        </td>
      </tr>
    `;
    return;
  }

  requestList.innerHTML = filteredRequests.map(request => {
    let actionButtons = "";

    if (request.status === "Pending") {
      actionButtons = `
        <button
          class="approve-button"
          data-id="${request.id}"
          data-action="approve">
          Approve
        </button>

        <button
          class="reject-button"
          data-id="${request.id}"
          data-action="reject">
          Reject
        </button>
      `;
    } else {
      actionButtons = `
        <button
          class="approve-button"
          data-id="${request.id}"
          data-action="change">
          Change Decision
        </button>
      `;
    }

    return `
      <tr>
        <td>
          <strong>${request.student}</strong><br>
          <small>${request.rollNo}</small>
        </td>

        <td>${request.event}</td>
        <td>${request.date}</td>
        <td>${request.mode}</td>

        <td>
          <span class="status ${request.status}">
            ${request.status}
          </span>
        </td>

        <td>
          <div class="action-buttons">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join("");
}


/* 6. APPROVE, REJECT OR CHANGE A DECISION */

function updateStatus(id, newStatus) {
  const request = requests.find(item => item.id === id);

  if (!request) {
    return;
  }

  if (request.status === newStatus) {
    feedback.textContent =
      `This request is already ${newStatus.toLowerCase()}.`;
    return;
  }

  const message = request.status === "Pending"
    ? `Are you sure you want to ${newStatus.toLowerCase()} ${request.student}'s request?`
    : `Current decision: ${request.status}.\n\nChange it to ${newStatus}?`;

  if (!window.confirm(message)) {
    return;
  }

  const previousStatus = request.status;

  request.status = newStatus;

  if (!saveRequests()) {
    request.status = previousStatus;
    return;
  }

  feedback.textContent =
    `Decision saved: ${request.student}'s request is now ${newStatus}.`;

  renderAll();
}


/* 7. HANDLE PERMISSION BUTTON CLICKS */

requestList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");

  if (!button) {
    return;
  }

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const request = requests.find(item => item.id === id);

  if (!request) {
    return;
  }

  if (action === "change") {
    const choice = window.prompt(
      `Current decision: ${request.status}\n\n` +
      "Type APPROVED or REJECTED to change the decision:"
    );

    if (choice === null || choice.trim() === "") {
      return;
    }

    const newStatus = choice.trim().toLowerCase();

    if (
      newStatus !== "approved" &&
      newStatus !== "rejected"
    ) {
      feedback.textContent =
        "Invalid choice. Please type APPROVED or REJECTED.";
      return;
    }

    updateStatus(
      id,
      newStatus === "approved" ? "Approved" : "Rejected"
    );

    return;
  }

  if (request.status !== "Pending") {
    return;
  }

  if (action === "approve") {
    updateStatus(id, "Approved");
  } else if (action === "reject") {
    updateStatus(id, "Rejected");
  }
});


/* 8. UPDATE DASHBOARD STATISTICS */

function renderStats() {
  document.getElementById("totalCount").textContent =
    requests.length;

  document.getElementById("pendingCount").textContent =
    requests.filter(request =>
      request.status === "Pending"
    ).length;

  document.getElementById("approvedCount").textContent =
    requests.filter(request =>
      request.status === "Approved"
    ).length;

  document.getElementById("rejectedCount").textContent =
    requests.filter(request =>
      request.status === "Rejected"
    ).length;
}


/* 9. DISPLAY ATTENDANCE-PROOF REVIEW */

function renderAttendance() {
  const approvedRequests = requests.filter(request =>
    request.status === "Approved"
  );

  if (approvedRequests.length === 0) {
    attendanceList.innerHTML = `
      <p class="empty-state">
        No approved students to review yet.
      </p>
    `;
    return;
  }

  attendanceList.innerHTML = approvedRequests.map(request => {
    let proofStatus = "Awaiting Proof";
    let proofClass = "Pending";
    let actionButtons = "";

    if (request.attendanceSubmitted) {
      if (request.attendanceProofStatus === "Verified") {
        proofStatus = "Verified";
        proofClass = "Verified";
      } else if (
        request.attendanceProofStatus === "Proof-Rejected"
      ) {
        proofStatus = "Rejected";
        proofClass = "Proof-Rejected";
      } else {
        proofStatus = "Pending Review";
        proofClass = "Pending-Review";
      }

      if (request.attendanceProofStatus === "Pending Review") {
        actionButtons = `
          <button
            class="approve-button"
            data-proof-id="${request.id}"
            data-proof-action="verify">
            Verify Proof
          </button>

          <button
            class="reject-button"
            data-proof-id="${request.id}"
            data-proof-action="reject">
            Reject Proof
          </button>
        `;
      } else {
        actionButtons = `
          <button
            class="approve-button"
            data-proof-id="${request.id}"
            data-proof-action="change">
            Change Decision
          </button>
        `;
      }
    }

    return `
      <article class="attendance-item">
        <div>
          <h3>${request.student} — ${request.event}</h3>

          <p>Roll No: ${request.rollNo}</p>

          <p>
            Attendance proof:
            <strong>
              ${request.attendanceSubmitted
                ? "Submitted"
                : "Not submitted"}
            </strong>
          </p>

          <p>
            Verification status:
            <span class="status ${proofClass}">
              ${proofStatus}
            </span>
          </p>
        </div>

        <div class="action-buttons">
          ${actionButtons}
        </div>
      </article>
    `;
  }).join("");
}


/* 10. VERIFY OR REJECT ATTENDANCE PROOF */

function updateAttendanceProof(id, newStatus) {
  const request = requests.find(item => item.id === id);

  if (
    !request ||
    request.status !== "Approved" ||
    !request.attendanceSubmitted
  ) {
    feedback.textContent =
      "Only submitted proof for approved students can be reviewed.";
    return;
  }

  if (request.attendanceProofStatus === newStatus) {
    feedback.textContent =
      `Attendance proof is already ${
        newStatus === "Proof-Rejected" ? "Rejected" : newStatus
      }.`;
    return;
  }

  const displayStatus =
    newStatus === "Proof-Rejected" ? "Rejected" : newStatus;

  const message =
    `Student: ${request.student}\n` +
    `Event: ${request.event}\n\n` +
    `Save attendance-proof decision as ${displayStatus}?`;

  if (!window.confirm(message)) {
    return;
  }

  const previousStatus = request.attendanceProofStatus;

  request.attendanceProofStatus = newStatus;

  if (!saveRequests()) {
    request.attendanceProofStatus = previousStatus;
    return;
  }

  feedback.textContent =
    `Attendance proof for ${request.student} is now ${displayStatus}.`;

  renderAll();
}


/* 11. HANDLE ATTENDANCE-PROOF BUTTON CLICKS */

attendanceList.addEventListener("click", event => {
  const button = event.target.closest(
    "button[data-proof-action]"
  );

  if (!button) {
    return;
  }

  const id = Number(button.dataset.proofId);
  const action = button.dataset.proofAction;
  const request = requests.find(item => item.id === id);

  if (!request) {
    return;
  }

  if (action === "change") {
    const currentDecision =
      request.attendanceProofStatus === "Proof-Rejected"
        ? "REJECTED"
        : "VERIFIED";

    const choice = window.prompt(
      `Current proof decision: ${currentDecision}\n\n` +
      "Type VERIFIED or REJECTED:"
    );

    if (choice === null || choice.trim() === "") {
      return;
    }

    const answer = choice.trim().toLowerCase();

    if (answer !== "verified" && answer !== "rejected") {
      feedback.textContent =
        "Invalid choice. Type VERIFIED or REJECTED.";
      return;
    }

    updateAttendanceProof(
      id,
      answer === "verified" ? "Verified" : "Proof-Rejected"
    );

    return;
  }

  updateAttendanceProof(
    id,
    action === "verify" ? "Verified" : "Proof-Rejected"
  );
});


/* 12. SEARCH AND FILTER EVENTS */

searchInput.addEventListener("input", renderRequests);

statusFilter.addEventListener("change", renderRequests);


/* 13. REFRESH ALL DASHBOARD SECTIONS */

function renderAll() {
  renderRequests();
  renderStats();
  renderAttendance();
}


/* 14. INITIALIZE DASHBOARD */

renderAll();
