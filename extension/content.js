function getPromptText() {
  const promptDiv = document.querySelector("div[contenteditable='true']");
  if (promptDiv) {
    const text = promptDiv.innerText.trim();
    console.log("[PromptCoach] Current prompt text:", text);
    return text;
  }
  return "";
}

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

function createFloatingPanel() {
  if (document.getElementById("floatingPromptPanel")) return;

  const panel = document.createElement("div");
  panel.id = "floatingPromptPanel";

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
    position: "fixed",
  });

  const title = document.createElement("div");
  title.textContent = "Prompt Analysis";
  title.style.fontWeight = "bold";
  title.style.marginBottom = "6px";
  title.style.textAlign = "center";
  panel.appendChild(title);

  const emotion = document.createElement("div");
  emotion.id = "emotionText";
  emotion.style.marginBottom = "3px";
  panel.appendChild(emotion);
  panel.appendChild(addMetricWithScoreBar("Emotion Confidence", 0, "#10B981")).id = "emotionBar";

  const intensity = document.createElement("div");
  intensity.id = "intensityText";
  intensity.style.marginBottom = "3px";
  panel.appendChild(intensity);
  panel.appendChild(addMetricWithScoreBar("Intensity Confidence", 0, "#e0e578")).id = "intensityBar";

  document.body.appendChild(panel);
}

function positionPanel() {
  const panel = document.getElementById("floatingPromptPanel");
  if (!panel) return;
  panel.style.top = "20px";
  panel.style.right = "20px";
  panel.style.width = "275px";
}

function updatePanel(promptText, emotionData) {
  const panel = document.getElementById("floatingPromptPanel");
  if (!panel) return;

  const emotionText = document.getElementById("emotionText");
  const intensityText = document.getElementById("intensityText");

  if (promptText && emotionData) {
    emotionText.textContent = `Emotion: ${emotionData.emotion} (${Math.round(emotionData.emotion_confidence)}%)`;
    intensityText.textContent = `Intensity: ${emotionData.intensity} (${Math.round(emotionData.intensity_confidence)}%)`;
    panel.style.display = "block";
    positionPanel();
  } else {
    panel.style.display = "none";
  }
}

setInterval(() => {
  const prompt = getPromptText();
  if (!prompt) return updatePanel("", null);

  fetch("http://127.0.0.1:5000/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  })
    .then((res) => res.json())
    .then((data) => {
      createFloatingPanel();
      updatePanel(prompt, data);
    })
    .catch((err) => console.error("API error:", err));
}, 2500);

window.addEventListener("resize", positionPanel);
window.addEventListener("scroll", positionPanel);
createFloatingPanel();
updatePanel("", null);