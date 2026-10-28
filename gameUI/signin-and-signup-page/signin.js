const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const API = "https://gameforge-l0nx.onrender.com";

function getReturnUrl() {
  const params = new URLSearchParams(location.search);
  const returnTo = params.get("returnTo");

  // Only allow paths on this website
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }

  return "/index.html";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginMessage.textContent = "Signing in...";

  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      loginMessage.textContent = data.error || "Login failed.";

      // If the account needs email verification,
      // send the user to signup with the return destination preserved.
      if (data.needsVerification && data.email) {
        const signupUrl = new URL("signup.html", location.href);
        signupUrl.searchParams.set("email", data.email);

        const returnTo = new URLSearchParams(location.search).get("returnTo");
        if (
          returnTo &&
          returnTo.startsWith("/") &&
          !returnTo.startsWith("//")
        ) {
          signupUrl.searchParams.set("returnTo", returnTo);
        }

        location.href = signupUrl.href;
      }

      return;
    }

    // The backend sets the HTTP-only cookie.
    // Do not store the authentication token in localStorage.
    location.href = getReturnUrl();
  } catch (error) {
    console.error("Login error:", error);
    loginMessage.textContent = "Could not connect to the server.";
  }
});
