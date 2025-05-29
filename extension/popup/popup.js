document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("lastPrompt", (data) => {
    const display = document.getElementById("prompt");
    display.textContent = data.lastPrompt || "No prompt found.";
  });
});
