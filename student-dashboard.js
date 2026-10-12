
/* =========================================
   STUDENT DASHBOARD - EVENT PORTAL
========================================= */


/* 1. SAMPLE TECHNICAL EVENTS */

const events = [
  {
    id: 1,
    title: "AI Innovation Hackathon",
    category: "Hackathon",
    mode: "Offline",
    date: "2026-11-12",
    venue: "Innovation Centre",
    description: "Build AI-powered solutions with other innovators."
  },
  {
    id: 2,
    title: "Web Development Workshop",
    category: "Workshop",
    mode: "Online",
    date: "2026-11-18",
    venue: "Online",
    description: "Learn modern frontend development techniques."
  },
  {
    id: 3,
    title: "Cloud Computing Conference",
    category: "Conference",
    mode: "Offline",
    date: "2026-11-25",
    venue: "Technology Auditorium",
    description: "Explore cloud platforms and emerging technologies."
  },
  {
    id: 4,
    title: "Cybersecurity Challenge",
    category: "Hackathon",
    mode: "Online",
    date: "2026-12-02",
    venue: "Online",
    description: "Solve security challenges and test your skills."
  },
  {
    id: 5,
    title: "Python and Machine Learning",
    category: "Workshop",
    mode: "Offline",
    date: "2026-12-08",
    venue: "Computer Lab",
    description: "Practice Python and machine learning fundamentals."
  },
  {
    id: 6,
    title: "Future of Technology Summit",
    category: "Conference",
    mode: "Online",
    date: "2026-12-15",
    venue: "Online",
    description: "Explore new ideas in software and AI."
  }
];


/* 2. SAMPLE APPLICATIONS
   Demo data resets after page refresh.
*/

const applications = [
  {
    eventId: 1,
    status: "Pending",
    requestDate: "2026-10-12",
    attendanceSubmitted: false
  },
  {
    eventId: 3,
    status: "Approved",
    requestDate: "2026-10-10",
    attendanceSubmitted: false
  }
];


/* 3. GET HTML ELEMENTS */

const eventList = document.getElementById("eventList");
const applicationList = document.getElementById("applicationList");
const attendanceList = document.getElementById("attendanceList");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const modeFilter = document.getElementById("modeFilter");


/* 4. HELPER FUNCTIONS */

function getEvent(eventId) {
  return events.find(event => event.id === eventId);
}

function formatDate(dateString) {
  return new Date(dateString + "T00:00:00").toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  );
}


/* =========================================
   5. EXPLORE EVENTS
========================================= */

function renderEvents() {

  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const mode = modeFilter.value;

  const filteredEvents = events.filter(event => {

    const matchesSearch =
      event.title.toLowerCase().includes(search) ||
      event.description.toLowerCase().includes(search) ||
      event.category.toLowerCase().includes(search) ||
      event.venue.toLowerCase().includes(search);

    const matchesCategory =
      category === "all" || event.category === category;

    const matchesMode =
      mode === "all" || event.mode === mode;

    return matchesSearch && matchesCategory && matchesMode;

  });

  eventList.replaceChildren();

  if (filteredEvents.length === 0) {
    eventList.innerHTML =
      '<p class="empty-state">No events match your search.</p>';
    return;
  }

  filteredEvents.forEach(event => {

    const application = applications.find(
      item => item.eventId === event.id
    );

    const card = document.createElement("article");
    card.className = "event-card";

    const categoryLabel = document.createElement("span");
    categoryLabel.className = "event-category";
    categoryLabel.textContent = event.category;

    const title = document.createElement("h3");
    title.textContent = event.title;

    const description = document.createElement("p");
    description.textContent = event.description;

    const date = document.createElement("p");
    date.textContent = "📅 " + formatDate(event.date);

    const venue = document.createElement("p");
    venue.textContent =
      "📍 " + event.venue + " · " + event.mode;

    const button = document.createElement("button");
    button.type = "button";

    if (application) {

      button.textContent = "Request Submitted";
      button.className = "requested-button";
      button.disabled = true;

    } else {

      button.textContent = "Request Permission";

      button.addEventListener("click", () => {
        requestPermission(event.id);
      });

    }

    card.append(
      categoryLabel,
      title,
      description,
      date,
      venue,
      button
    );

    eventList.appendChild(card);

  });
}


/* =========================================
   6. REQUEST PERMISSION
========================================= */

function requestPermission(eventId) {

  const event = getEvent(eventId);

  if (!event) return;

  // Prevent duplicate requests
  const alreadyApplied = applications.some(
    application => application.eventId === eventId
  );

  if (alreadyApplied) {
    alert("You have already requested permission for this event.");
    return;
  }

  // Confirmation
  const confirmed = window.confirm(
    `Do you want to request permission for "${event.title}"?`
  );

  if (!confirmed) return;

  // Get today's local date in YYYY-MM-DD format
  const today = new Date();
  const localDate =
    today.getFullYear() + "-" +
    String(today.getMonth() + 1).padStart(2, "0") + "-" +
    String(today.getDate()).padStart(2, "0");

  // Create application
  const newApplication = {
    eventId: eventId,
    status: "Pending",
    requestDate: localDate,
    attendanceSubmitted: false
  };

  // Add application
  applications.push(newApplication);

  // Update dashboard
  renderAll();

  alert("Permission request submitted successfully!");

  // Navigate to My Applications
  document.getElementById("applications").scrollIntoView({
    behavior: "smooth"
  });

}


/* =========================================
   7. MY APPLICATIONS
========================================= */

function renderApplications() {

  applicationList.replaceChildren();

  if (applications.length === 0) {
    applicationList.innerHTML =
      '<tr><td colspan="4">No applications submitted yet.</td></tr>';
    return;
  }

  applications.forEach(application => {

    const event = getEvent(application.eventId);

    if (!event) return;

    const row = document.createElement("tr");

    const title = document.createElement("td");
    title.textContent = event.title;

    const category = document.createElement("td");
    category.textContent = event.category;

    const requestDate = document.createElement("td");
    requestDate.textContent = formatDate(application.requestDate);

    const statusCell = document.createElement("td");

    const status = document.createElement("span");
    status.className = "status " + application.status;
    status.textContent = application.status;

    statusCell.appendChild(status);

    row.append(
      title,
      category,
      requestDate,
      statusCell
    );

    applicationList.appendChild(row);

  });
}


/* =========================================
   8. ATTENDANCE TRACKING
========================================= */

function renderAttendance() {

  attendanceList.replaceChildren();

  const approved = applications.filter(
    application => application.status === "Approved"
  );

  if (approved.length === 0) {
    attendanceList.innerHTML =
      '<p class="empty-state">Approved events will appear here.</p>';
    return;
  }

  approved.forEach(application => {

    const event = getEvent(application.eventId);

    if (!event) return;

    const item = document.createElement("div");
    item.className = "attendance-item";

    const details = document.createElement("div");

    const title = document.createElement("h3");
    title.textContent = event.title;

    const description = document.createElement("p");

    description.textContent = application.attendanceSubmitted
      ? "Demo attendance proof marked as submitted."
      : "Permission approved · Attendance proof not submitted.";

    details.append(title, description);

    const button = document.createElement("button");
    button.type = "button";

    button.textContent = application.attendanceSubmitted
      ? "Proof Submitted ✓"
      : "Mark Proof Submitted";

    button.disabled = application.attendanceSubmitted;

    button.addEventListener("click", () => {

      const confirmed = window.confirm(
        "Mark attendance proof as submitted for this demo?"
      );

      if (!confirmed) return;

      application.attendanceSubmitted = true;

      renderAll();

    });

    item.append(details, button);

    attendanceList.appendChild(item);

  });
}


/* =========================================
   9. DASHBOARD STATISTICS
========================================= */

function renderStats() {

  document.getElementById("eventCount").textContent =
    events.length;

  document.getElementById("pendingCount").textContent =
    applications.filter(
      item => item.status === "Pending"
    ).length;

  document.getElementById("approvedCount").textContent =
    applications.filter(
      item => item.status === "Approved"
    ).length;

  document.getElementById("attendanceCount").textContent =
    applications.filter(
      item => item.attendanceSubmitted
    ).length;

}


/* =========================================
   10. UPDATE ALL DASHBOARD SECTIONS
========================================= */

function renderAll() {

  renderEvents();
  renderApplications();
  renderAttendance();
  renderStats();

}


/* =========================================
   11. EVENT SEARCH AND FILTER LISTENERS
========================================= */

searchInput.addEventListener("input", renderEvents);

categoryFilter.addEventListener("change", renderEvents);

modeFilter.addEventListener("change", renderEvents);


/* =========================================
   12. STUDENT PROFILE
========================================= */

function loadStudentProfile() {

  const nameElement = document.getElementById("studentName");
  const emailElement = document.getElementById("studentEmail");
  const photoElement = document.getElementById("studentPhoto");

  const savedName = sessionStorage.getItem("userName");
  const savedEmail = sessionStorage.getItem("userEmail");
  const savedPhoto = sessionStorage.getItem("userPhoto");

  if (nameElement && savedName) {
    nameElement.textContent = savedName;
  }

  if (emailElement && savedEmail) {
    emailElement.textContent = savedEmail;
  }

  if (photoElement && savedPhoto) {

    try {

      const photoUrl = new URL(savedPhoto);

      if (photoUrl.protocol === "https:") {
        photoElement.src = photoUrl.href;
      }

    } catch (error) {
      // Keep the default image if the URL is invalid.
    }

  }

}


/* =========================================
   13. INITIALIZE STUDENT DASHBOARD
========================================= */

renderAll();

loadStudentProfile();
