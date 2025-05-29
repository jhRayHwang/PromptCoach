function getPromptText() {
  const promptDiv = document.querySelector("div[contenteditable='true']"); // Or textarea
  if (promptDiv) {
    const text = promptDiv.innerText.trim();
    console.log("[PromptCoach] Current prompt text:", text);
    return text;
  }
  return "";
}

// scoreBar
function addMetricWithScoreBar(labelText, scorePercent, color = "#4CAF50") {
  const container = document.createElement("div");
  container.className = "metric-container";

  const bar = document.createElement("div");
  bar.className = "score-bar";

  const label = document.createElement("span");
  label.className = "metric-label";
  label.textContent = labelText;

  const fill = document.createElement("div");
  fill.className = "score-bar-fill";
  fill.style.width = `${scorePercent}%`;
  fill.style.backgroundColor = color;

  bar.appendChild(fill);
  container.appendChild(bar);
  container.appendChild(label);

  return container;
}

// Floating Panel
function createFloatingPanel() {
  if (document.getElementById("floatingPromptPanel")) return;

  const panel = document.createElement("div");
  panel.id = "floatingPromptPanel";

  const promptBox = document.getElementById("prompt-textarea");
    if (promptBox) {
      const rect = promptBox.getBoundingClientRect();

      Object.assign(panel.style, {
        backgroundColor: "#282828",
        border: "2px solid #333",
        borderRadius: "8px",
        padding: "10px",
        boxShadow: "0 0 10px rgba(0,0,0,0.3)",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        zIndex: 9999999,
        display: "none",
      });

    }

  const title = document.createElement("div");
  title.textContent = "Prompt Analysis";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "6px";
  title.style.textAlign = "center";
  panel.appendChild(title);

  const emotion = document.createElement("div");
  emotion.textContent = "Exhibits Anger of intensity 5"
  emotion.style.marginBottom = "3px";
  panel.appendChild(emotion);
  panel.appendChild(addMetricWithScoreBar("Confidence", 97, "#10B981")); 
  
  const readability = document.createElement("div");
  readability.textContent = "Readability: 82% (Good)"
  readability.style.marginBottom = "3px";
  panel.appendChild(readability);
  panel.appendChild(addMetricWithScoreBar("Confidence", 84, "#78e5a4")); 

  const lex_diversity = document.createElement("div");
  lex_diversity.textContent = "Lexical Diversity: 45% (Needs Improvement)"
  lex_diversity.style.marginBottom = "3px";
  panel.appendChild(lex_diversity);
  panel.appendChild(addMetricWithScoreBar("Confidence", 65, "#e0e578")); 

  const perplexity = document.createElement("div");
  perplexity.textContent = "Perplexity: 90% (High - prompt might be confusing)"
  perplexity.style.marginBottom = "6px";
  panel.appendChild(perplexity);
  panel.appendChild(addMetricWithScoreBar("Confidence", 65, "#e0e578")); 

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

function positionPanel() {
  const panel = document.getElementById("floatingPromptPanel");
  const promptBox = document.getElementById("prompt-textarea");

  if (!panel || !promptBox) return;

  const rect = promptBox.getBoundingClientRect();
  const panelWidth = 275;

  // Temporarily display the panel to measure height if hidden
  const prevDisplay = panel.style.display;
  panel.style.display = "block";

  const panelHeight = panel.offsetHeight;

  Object.assign(panel.style, {
    position: "fixed",
    left: `${rect.left + rect.width - panelWidth + 10}px`,
    top: `${rect.top - panelHeight - 30}px`, // position using dynamic height
    width: `${panelWidth}px`,
  });

  // Restore display if it was hidden before
  if (prevDisplay === "none") panel.style.display = "none";
}

function updatePanel(promptText) {
  const panel = document.getElementById("floatingPromptPanel");
  const content = document.getElementById("floatingPromptContent");

  if (!panel || !content) return;

  if (promptText) {
    content.textContent = promptText;
    panel.style.display = "block";  // show panel
    positionPanel();
  } else {
    panel.style.display = "none";   // hide panel if no prompt
  }
}

// Reposition panel when layout changes
window.addEventListener("resize", positionPanel);
window.addEventListener("scroll", positionPanel);

// Optional safety net if layout changes without events
setInterval(positionPanel, 1000);

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
