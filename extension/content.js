function getPromptText() {
  const promptDiv = document.getElementById("prompt-textarea");
  if (promptDiv) {
    const p = promptDiv.querySelector("p");
    if (p) {
      return p.innerText.trim();
    }
  }
  return "";
}

// scoreBar
function addMetricWithScoreBar(labelText, scorePercent, color = "#4CAF50") {
  const container = document.createElement("div");
  container.className = "metric-container";

  const label = document.createElement("span");
  label.className = "metric-label";
  label.textContent = labelText;

  const bar = document.createElement("div");
  bar.className = "score-bar";

  const fill = document.createElement("div");
  fill.className = "score-bar-fill";
  fill.style.width = `${scorePercent}%`;
  fill.style.backgroundColor = color;

  bar.appendChild(fill);
  container.appendChild(label);
  container.appendChild(bar);

  return container;
}

// Floating Panel
function createFloatingPanel() {
  if (document.getElementById("floatingPromptPanel")) return;

  const panel = document.createElement("div");
  panel.id = "floatingPromptPanel";

  Object.assign(panel.style, {
    position: "fixed",
    bottom: "150px",
    right: "50px",
    width: "375px",
    maxHeight: "150px",
    overflowY: "auto",
    backgroundColor: "#282828",
    border: "2px solid #333",
    borderRadius: "8px",
    padding: "10px",
    boxShadow: "0 0 10px rgba(0,0,0,0.3)",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    zIndex: 9999999,
    display: "none",  // start hidden
  });

  const title = document.createElement("div");
  title.textContent = "Prompt Analysis";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "6px";
  title.style.textAlign = "center";
  panel.appendChild(title);
  
  const readability = document.createElement("div");
  readability.textContent = "Readability: 82% (Good)"
  readability.style.marginBottom = "3px";
  panel.appendChild(readability);

  const lex_diversity = document.createElement("div");
  lex_diversity.textContent = "Lexical Diversity: 45% (Needs Improvement)"
  lex_diversity.style.marginBottom = "3px";
  panel.appendChild(lex_diversity);
  panel.appendChild(addMetricWithScoreBar("Readability", 65, "#10B981")); // green

  const perplexity = document.createElement("div");
  perplexity.textContent = "Perplexity: 90% (High - prompt might be confusing)"
  perplexity.style.marginBottom = "6px";
  panel.appendChild(perplexity);

  const currentPrompt = document.createElement("div");
  currentPrompt.textContent = "Current Prompt (will remove this section later because it is redundant):";
  currentPrompt.style.marginBottom = "6px";
  panel.appendChild(currentPrompt);

  const content = document.createElement("div");
  content.id = "floatingPromptContent";
  content.style.marginBottom = "6px";
  content.style.whiteSpace = "normal";
  content.style.overflowWrap = "break-word";
  content.style.wordBreak = "break-word";
  panel.appendChild(content);

  document.body.appendChild(panel);
}

function updatePanel(promptText) {
  const panel = document.getElementById("floatingPromptPanel");
  const content = document.getElementById("floatingPromptContent");

  if (!panel || !content) return;

  if (promptText) {
    content.textContent = promptText;
    panel.style.display = "block";  // show panel
  } else {
    panel.style.display = "none";   // hide panel if no prompt
  }
}

// Main loop: check prompt, save, and update panel
setInterval(() => {
  const prompt = getPromptText();

  if (prompt) {
    // Save prompt and show panel
    chrome.storage.local.set({ lastPrompt: prompt }, () => {
      // Create panel if not exists
      createFloatingPanel();
      updatePanel(prompt);
    });
  } else {
    // Hide panel if prompt empty
    updatePanel("");
  }
}, 2000);

// Also create panel on load but keep hidden initially
createFloatingPanel();
updatePanel("");
