// include.js

// 로그인 체크 & 헤더 UI 제어
function updateHeaderAuthUI() {
  const token = localStorage.getItem("token");

  const loginBtn = document.getElementById("btn-login");
  const logoutBtn = document.getElementById("btn-logout");
  const startBtn = document.getElementById("btn-start");

  if (!loginBtn || !logoutBtn) return;

  if (token) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    if (startBtn) startBtn.href = "generate.html";
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    if (startBtn) startBtn.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", updateHeaderAuthUI);

// 로그아웃
function logout() {
  localStorage.removeItem("token");
  alert("로그아웃 되었습니다.");
  location.href = "login.html";
}