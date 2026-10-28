const signupForm = document.getElementById("signUpForm");
const verifyForm = document.getElementById("verifyForm");

const signupMessage = document.getElementById("signupMessage");
const verifyMessage = document.getElementById("verifyMessage");

const emailInput = document.getElementById("signUpEmail");
const API = "https://gameforge-l0nx.onrender.com";

let pendingEmail = "";

function getReturnUrl() {
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo");

  // Only allow relative paths on this website.
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }

  return "/index.html";
}

// Sign up
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  signupMessage.textContent = "Creating your account...";

  const username = document.getElementById("signUpName").value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = document.getElementById("signUpPassword").value;

  try {
    const response = await fetch(`/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      signupMessage.textContent = data.error || "Signup failed.";
      return;
    }

    pendingEmail = email;

    signupForm.hidden = true;
    verifyForm.hidden = false;
    verifyMessage.textContent = "Check your email for the verification code.";
  } catch (error) {
    signupMessage.textContent = "Could not connect to the server.";
    console.error(error);
  }
});

// Verify email
verifyForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  verifyMessage.textContent = "Verifying your email...";

  const code = document.getElementById("verifyCode").value.trim();

  try {
    const response = await fetch(`/api/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: pendingEmail, code }),
    });

    const data = await response.json();

    if (!response.ok) {
      verifyMessage.textContent = data.error || "Verification failed.";
      return;
    }

    // The backend sets the HTTP-only login cookie.
    // Preserve the user's chosen destination, if there is one.
    location.href = getReturnUrl();
  } catch (error) {
    verifyMessage.textContent = "Could not connect to the server.";
    console.error(error);
  }
});

// Resend verification code
document.getElementById("resendCode").addEventListener("click", async () => {
  verifyMessage.textContent = "Requesting a new code...";

  try {
    const response = await fetch(`/api/auth/resend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email: pendingEmail }),
    });

    const data = await response.json();

    verifyMessage.textContent = response.ok
      ? "A new code has been sent."
      : data.error || "Could not resend the code.";
  } catch (error) {
    verifyMessage.textContent = "Could not connect to the server.";
    console.error(error);
  }
});
