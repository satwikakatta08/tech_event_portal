
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const googleButton = document.getElementById("googleLoginButton");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  if (!email || !password || !role) {
    message.textContent = "Please fill in all fields.";
    return;
  }

  // Demo navigation only. No password verification.
  if (role === "student") {
    window.location.href = "student-dashboard.html";
  } else if (role === "proctor") {
    message.textContent =
      "Faculty access requires authorization.";
  }
});

googleButton.addEventListener("click", function () {
  message.textContent =
    "Google sign-in will be available after Firebase integration.";
});
