const API = "https://gameforge-l0nx.onrender.com"
const SIGNUP_URL = `/signin-and-signup-page/signup.html`;
const LOGIN_URL = `/signin-and-signup-page/signin.html`;
const HOME_URL = `/index.html`;
const AUTH_URL = `${API}/api/auth`;

/* ---------- Authentication ---------- */

const Auth = {
  user: null,

  async check() {
    try {
      const response = await fetch(`${AUTH_URL}/me`, {
        credentials: "same-origin",
      });

      if (!response.ok) {
        this.user = null;
        return null;
      }

      const data = await response.json();
      this.user = data.user;
      return this.user;
    } catch (error) {
      console.error("Authentication check failed:", error);
      this.user = null;
      return null;
    }
  },

  async logout() {
    try {
      await fetch(`${AUTH_URL}/logout`, {
        method: "POST",
        credentials: "same-origin",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }

    this.user = null;
    location.replace(HOME_URL);
  },
};

/* ---------- Scores (local for now) ---------- */

function getScores() {
  try {
    return JSON.parse(localStorage.getItem("gf_scores")) || {};
  } catch {
    return {};
  }
}

function saveScore(game, score) {
  const scores = getScores();

  if (score > (scores[game] || 0)) {
    scores[game] = score;
    localStorage.setItem("gf_scores", JSON.stringify(scores));
  }
}

/* ---------- Shared navigation ---------- */

const headerHTML = `
<nav class="nav-header">
  <div class="search-box">
    <i class="fa-solid fa-magnifying-glass"></i>
    <input type="search" name="search" id="searchBar"
      placeholder="Search games..." />
  </div>

  <div class="nav-header-content">
    <i class="fa-solid fa-bell notification"></i>
    <a href="${LOGIN_URL}" data-logged-out>Log in</a>
    <a href="${SIGNUP_URL}" data-logged-out>Sign up</a>

    <div class="user-profile">
      <div class="profile-avatar">
        <div class="avatar-head"></div>
        <div class="avatar-body"></div>
      </div>

      <p data-username>Guest</p>
      <i class="fa-solid fa-chevron-down"></i>

      <div class="user-menu">
        <a href="/profile.html">Profile</a>
        <a href="/settings.html">Settings</a>
        <button type="button" id="logoutBtn">Log out</button>
      </div>
    </div>
  </div>
</nav>`;

function activePage() {
  const path = location.pathname;

  if (
    path.includes("rps_game") ||
    path.includes("snake_game") ||
    path.includes("games.html")
  )
    return "games";

  if (path.includes("leaderboard")) return "leaderboard";
  if (path.includes("profile")) return "profile";
  if (path.includes("settings")) return "settings";

  return "home";
}

function sidebarHTML(active) {
  const cls = (name) => (name === active ? ' class="active"' : "");

  return `
<nav class="sidebar">
  <div class="logo">
    <div class="logo-icon"></div>
    <h2>Game<span>Forge</span></h2>
  </div>

  <div class="sidebar-divs">
    <a href="${HOME_URL}"${cls("home")}>
      <div class="home-menu">
        <i class="fa-solid fa-house"></i><p>Home</p>
      </div>
    </a>

    <a href="/games.html"${cls("games")}>
      <div class="game-menu">
        <div class="game-icon"></div><p>Games</p>
      </div>
    </a>

    <a href="/leaderboard.html"${cls("leaderboard")}>
      <div class="leaderboard-menu">
        <i class="fa-solid fa-trophy"></i><p>LeaderBoard</p>
      </div>
    </a>

    <a href="/profile.html"${cls("profile")}>
      <div><i class="fa-solid fa-user"></i><p>Profile</p></div>
    </a>

    <a href="/settings.html"${cls("settings")}>
      <div><i class="fa-solid fa-gear"></i><p>Settings</p></div>
    </a>
  </div>

  <div class="slogan">
    <p>Small games.</p>
    <p>Big fun.</p>
    <div class="divider"></div>
  </div>
</nav>`;
}

/* ---------- Page protection ---------- */

function isProtectedPage() {
  const path = location.pathname;

  return (
    document.body.hasAttribute("data-protected") ||
    path.endsWith("/profile.html") ||
    path.endsWith("/settings.html") ||
    path.includes("/rps_game/") ||
    path.includes("/snake_game/")
  );
}

function getSafeReturnPath() {
  return location.pathname + location.search + location.hash;
}

/* ---------- Start-up ---------- */

async function init() {
  const user = await Auth.check();

  // Do not display protected pages to logged-out users
  if (!user && isProtectedPage()) {
    const returnTo = encodeURIComponent(getSafeReturnPath());

    location.replace(`${LOGIN_URL}?returnTo=${returnTo}`);
    return;
  }

  document.body.insertAdjacentHTML(
    "afterbegin",
    headerHTML + sidebarHTML(activePage()),
  );

  document.body.classList.toggle("logged-in", !!user);

  // Set username
  document.querySelectorAll("[data-username]").forEach((element) => {
    element.textContent = user ? user.username : "Guest";
  });

  // Logged-out navigation
  document.querySelectorAll("[data-logged-out]").forEach((element) => {
    element.style.display = user ? "none" : "";
  });

  // Show profile dropdown only for logged-in users
  const profileBox = document.querySelector(".user-profile");

  if (profileBox) {
    profileBox.style.display = user ? "flex" : "none";
  }

  // Hide Profile and Settings in the sidebar when logged out
  document
    .querySelectorAll(
      ".sidebar-divs > a[href='/profile.html'], " +
        ".sidebar-divs > a[href='/settings.html']",
    )
    .forEach((link) => {
      link.style.display = user ? "" : "none";
    });

  // Display local best scores
  const scores = getScores();

  document.querySelectorAll("[data-best]").forEach((element) => {
    element.textContent = scores[element.dataset.best] || 0;
  });

  // Game links
  document.querySelectorAll("[data-play]").forEach((link) => {
    if (user) {
      link.href = link.dataset.play;
    } else {
      const returnTo = encodeURIComponent(link.dataset.play);
      link.href = `${SIGNUP_URL}?returnTo=${returnTo}`;
    }
  });

  // Profile dropdown
  const menu = document.querySelector(".user-menu");
  const logoutBtn = document.getElementById("logoutBtn");

  if (profileBox && menu) {
    profileBox.addEventListener("click", (event) => {
      if (event.target.closest(".user-menu")) return;

      event.stopPropagation();
      menu.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      menu.classList.remove("open");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => Auth.logout());
  }

  // Search game cards
  const searchBar = document.getElementById("searchBar");

  if (searchBar) {
    searchBar.addEventListener("input", (event) => {
      const query = event.target.value.trim().toLowerCase();

      document
        .querySelectorAll(".game-grid-container .card")
        .forEach((card) => {
          const name = card.querySelector("p")?.textContent.toLowerCase() || "";
          card.style.display = name.includes(query) ? "" : "none";
        });
    });
  }
}

init();
