
const events = [
  {
    id: 1,
    title: "CodeFest 2026",
    college: "ABC Engineering College",
    location: "Hyderabad",
    date: "Nov 14, 2026",
    category: "Hackathon",
    mode: "Offline",
    icon: "💻",
    cover: "cover-hackathon",
    description: "Build innovative software solutions, collaborate with teams, and present your ideas."
  },
  {
    id: 2,
    title: "Technovate Workshop",
    college: "XYZ Institute of Technology",
    location: "Hyderabad",
    date: "Nov 20, 2026",
    category: "Workshop",
    mode: "Offline",
    icon: "⚙️",
    cover: "cover-workshop",
    description: "Explore emerging technologies through practical technical sessions."
  },
  {
    id: 3,
    title: "AI Innovation Summit",
    college: "PQR College of Engineering",
    location: "Online",
    date: "Nov 25, 2026",
    category: "Conference",
    mode: "Online",
    icon: "🤖",
    cover: "cover-ai",
    description: "Learn about artificial intelligence, machine learning, and real-world applications."
  },
  {
    id: 4,
    title: "RoboWars Challenge",
    college: "LMN Technical University",
    location: "Bengaluru",
    date: "Dec 5, 2026",
    category: "Competition",
    mode: "Offline",
    icon: "🦾",
    cover: "cover-competition",
    description: "Test your robotics skills in a hands-on engineering competition."
  },
  {
    id: 5,
    title: "Web Development Bootcamp",
    college: "National Tech Institute",
    location: "Online",
    date: "Dec 12, 2026",
    category: "Workshop",
    mode: "Online",
    icon: "🌐",
    cover: "cover-techfest",
    description: "Learn modern website development and build your first web project."
  },
  {
    id: 6,
    title: "FutureTech Challenge",
    college: "Digital Innovation College",
    location: "Chennai",
    date: "Dec 19, 2026",
    category: "Hackathon",
    mode: "Offline",
    icon: "🚀",
    cover: "cover-conference",
    description: "Work with other innovators to prototype solutions to real-world problems."
  }
];

const $ = id => document.getElementById(id);

const eventGrid = $("eventGrid");
const searchInput = $("searchInput");
const categoryFilter = $("categoryFilter");
const modeFilter = $("modeFilter");
const emptyMessage = $("emptyMessage");
const modal = $("eventModal");
const modalBody = $("modalBody");

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function renderEvents() {
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const mode = modeFilter.value;

  const filtered = events.filter(event => {
    const searchable = [
      event.title, event.college, event.location, event.category
    ].join(" ").toLowerCase();

    return searchable.includes(search) &&
      (category === "all" || event.category === category) &&
      (mode === "all" || event.mode === mode);
  });

  eventGrid.innerHTML = filtered.map(event => `
    <article class="event-card">
      <div class="event-cover ${event.cover}">
        <span class="cover-icon">${event.icon}</span>
        <h3>${event.title}</h3>
      </div>
      <div class="event-info">
        <span class="category-pill">${event.category}</span>
        <h3>${event.title}</h3>
        <p class="college-name">${event.college}</p>
        <div class="event-meta">
          <span>📅 ${event.date}</span>
          <span>📍 ${event.location}</span>
          <span>🌐 ${event.mode}</span>
        </div>
        <div class="event-actions">
          <button type="button" class="small-btn"
            data-details="${event.id}">View Details</button>
          <button type="button" class="small-btn filled"
            data-apply="${event.id}">Apply</button>
        </div>
      </div>
    </article>
  `).join("");

  emptyMessage.hidden = filtered.length !== 0;
}


function openModal(html) {
  modalBody.innerHTML = html;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  const closeButton = document.getElementById("closeModal");
  closeButton.focus();
}



function closeModal() {
  // Move keyboard focus out of the modal before hiding it
  const previouslyFocused = modal.contains(document.activeElement);

  if (previouslyFocused) {
    const activeElement = document.activeElement;
    activeElement.blur();
  }

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}


function showEventDetails(id) {
  const event = events.find(item => item.id === Number(id));
  if (!event) return;

  openModal(`
    <span class="category-pill">${event.category}</span>
    <h2>${event.icon} ${event.title}</h2>
    <p><strong>Host college:</strong> ${event.college}</p>
    <p><strong>Date:</strong> ${event.date}</p>
    <p><strong>Location:</strong> ${event.location}</p>
    <p><strong>Mode:</strong> ${event.mode}</p>
    <p>${event.description}</p>
    <p><strong>Demo only:</strong> Confirm the event with its organizer.</p>
    <button type="button" class="btn primary"
      data-apply="${event.id}">Request College Permission</button>
  `);
}

function showPermissionForm(eventId = "") {
  const options = events.map(event => `
    <option value="${event.id}"
      ${event.id === Number(eventId) ? "selected" : ""}>
      ${event.title} — ${event.college}
    </option>
  `).join("");

  openModal(`
    <h2>Participation Permission</h2>
    <p>Prepare a request for your college faculty.</p>
    <form id="permissionForm">
      <label for="studentName">Student name</label>
      <input id="studentName" name="studentName"
        placeholder="Enter your name" required>

      <label for="studentRoll">Roll number</label>
      <input id="studentRoll" name="studentRoll"
        placeholder="Enter your roll number" required>

      <label for="requestedEvent">Select event</label>
      <select id="requestedEvent" name="requestedEvent" required>
        ${options}
      </select>

      <label for="requestReason">Reason for participation</label>
      <textarea id="requestReason" name="requestReason" rows="3"
        placeholder="Why do you want to attend?" required></textarea>

      <button type="submit" class="btn primary">Prepare Request</button>
    </form>
    <p>This demo does not send requests to faculty or save them permanently.</p>
  `);
}

function showInfo(title, description) {
  openModal(`
    <h2>${title}</h2>
    <p>${description}</p>
    <p>This feature will display real records after login and database setup.</p>
  `);
}

// Event cards and quick-action buttons
document.addEventListener("click", event => {
  const details = event.target.closest("[data-details]");
  const apply = event.target.closest("[data-apply]");
  const action = event.target.closest("[data-action]");

  if (details) {
    showEventDetails(details.dataset.details);
    return;
  }

  if (apply) {
    showPermissionForm(apply.dataset.apply);
    return;
  }

  if (action) {
    const actions = {
      permission: () => showPermissionForm(),
      applications: () => showInfo(
        "My Applications",
        "Your participation permission requests will appear here."
      ),
      attendance: () => showInfo(
        "My Attendance",
        "Your verified attendance records will appear here."
      )
    };

    actions[action.dataset.action]?.();
  }
});

// Submit the demo form
document.addEventListener("submit", event => {
  if (event.target.id !== "permissionForm") return;

  event.preventDefault();

  const data = new FormData(event.target);
  const selected = events.find(
    item => item.id === Number(data.get("requestedEvent"))
  );

  if (!selected) return;

  const name = data.get("studentName").trim();
  const roll = data.get("studentRoll").trim();
  const reason = data.get("requestReason").trim();

  const requestText = [
    "PARTICIPATION PERMISSION REQUEST",
    `Student: ${name}`,
    `Roll number: ${roll}`,
    `Event: ${selected.title}`,
    `Host college: ${selected.college}`,
    `Date: ${selected.date}`,
    `Reason: ${reason}`,
    "Status: Prepared locally; not submitted."
  ].join("\n");

  openModal(`
    <h2>Request Prepared!</h2>
    <p>Your request has been prepared successfully in this demo.</p>
    <p><strong>Student:</strong> ${escapeHTML(name)}</p>
    <p><strong>Event:</strong> ${selected.title}</p>
    <p><strong>Status:</strong> Not submitted to faculty</p>
    <button type="button" class="btn primary" id="copyRequest">
      Copy Request
    </button>
  `);

  $("copyRequest").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(requestText);
      $("copyRequest").textContent = "Copied successfully!";
    } catch {
      const area = document.createElement("textarea");
      area.value = requestText;
      area.readOnly = true;
      area.style.width = "100%";
      area.style.marginTop = "12px";
      modalBody.appendChild(area);
      area.select();
      $("copyRequest").textContent = "Select and copy the text below";
    }
  });
});

// Modal close controls
$("closeModal").addEventListener("click", closeModal);

modal.addEventListener("click", event => {
  if (event.target === modal) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") closeModal();
});

// Search and filters
searchInput.addEventListener("input", renderEvents);
categoryFilter.addEventListener("change", renderEvents);
modeFilter.addEventListener("change", renderEvents);

// Initial display
renderEvents();
