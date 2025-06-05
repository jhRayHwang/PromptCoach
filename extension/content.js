function getPromptText() {
  const promptDiv = document.querySelector("div[contenteditable='true']");
  if (promptDiv) {
    const text = promptDiv.innerText.trim();
    console.log("[PromptCoach] Current prompt text:", text);
    return text;
  }
  return "";
}

function addMetricWithScoreBar(labelID, fillID, scorePercent = 0) {
  const container = document.createElement("div");
  container.className = "metric-container";

  const bar = document.createElement("div");
  bar.className = "score-bar";

  const label = document.createElement("span");
  label.className = "metric-label";
  label.id = labelID;
  label.textContent = `Confidence ${scorePercent}%`;

  const fill = document.createElement("div");
  fill.className = "score-bar-fill";
  fill.id = fillID;
  fill.style.width = `${scorePercent}%`;
  fill.style.backgroundColor = getColorForScore(scorePercent);

  bar.appendChild(fill);
  container.appendChild(bar);
  container.appendChild(label);

  return container;
}

function getColorForScore(scorePercent) {
  if (scorePercent >= 80) return "#10B981";
  if (scorePercent >= 60) return "#84cc16";
  if (scorePercent >= 40) return "#e0e578";
  if (scorePercent >= 20) return "#f59e0b";
  return "#ef4444";
}

const suggestionsMap = {
  anger: {
    perplexity: "💡 Intense anger can confuse models—clarify intent.",
    lexical_diversity: "💡 Reframe harsh words for clearer expression.",
    readability: "💡 Anger can tangle meaning—simplify sentence flow.",
  },
  sad: {
    perplexity: "💡 Add focus—sad tones often seem vague.",
    lexical_diversity: "💡 Use varied words to enrich emotional clarity.",
    readability: "💡 Shorten or split long emotional sentences.",
  },
  anxious: {
    perplexity: "💡 Anxious prompts may ramble—aim for precision.",
    lexical_diversity: "💡 Limit repetition—calm, varied wording helps clarity.",
    readability: "💡 Break down anxious thoughts into clear steps.",
  },
  joy: {
    perplexity: "💡 Stay focused—joyful language can drift off-topic.",
    lexical_diversity: "💡 Keep cheerful language balanced and clear.",
    readability: "💡 Joy can get wordy—trim excess excitement.",
  },
  gratitude: {
    perplexity: "💡 Make thanks specific—vagueness raises complexity.",
    lexical_diversity: "💡 Combine warmth with clarity in phrasing.",
    readability: "💡 Keep appreciation direct and concise.",
  },
  hopefulness: {
    perplexity: "💡 Hopeful prompts may overreach—ground them clearly.",
    lexical_diversity: "💡 Vary optimistic phrases to stay natural.",
    readability: "💡 Aim for clarity—too much hope can obscure purpose.",
  }
};

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
  panel.appendChild(addMetricWithScoreBar("emoConfLabel", "scoreBarFill"));

  const perplexity = document.createElement("div");
  perplexity.id = "perplexityText";
  perplexity.style.marginBottom = "3px";
  panel.appendChild(perplexity);
  panel.appendChild(addMetricWithScoreBar("perplexityLabel", "perplexityFill"));

  const lexdiv = document.createElement("div");
  lexdiv.id = "lexdivText";
  lexdiv.style.marginBottom = "3px";
  panel.appendChild(lexdiv);
  panel.appendChild(addMetricWithScoreBar("lexdivLabel", "lexdivFill"));

  const readability = document.createElement("div");
  readability.id = "readabilityText";
  readability.style.marginBottom = "3px";
  panel.appendChild(readability);
  panel.appendChild(addMetricWithScoreBar("readabilityLabel", "readabilityFill"));

  document.body.appendChild(panel);
}

function positionPanel() {
  const panel = document.getElementById("floatingPromptPanel");
  const promptBox = document.querySelector("div[contenteditable='true']");

  if (!panel || !promptBox) return;

  const rect = promptBox.getBoundingClientRect();
  const panelWidth = 275;

  const prevDisplay = panel.style.display;
  panel.style.display = "block"; // temporarily show for measuring height

  const panelHeight = panel.offsetHeight;

  Object.assign(panel.style, {
    position: "fixed",
    left: `${rect.left + rect.width - panelWidth + 10}px`,
    top: `${rect.top + window.scrollY - panelHeight - 30}px`,
    width: `${panelWidth}px`,
  });

  if (prevDisplay === "none") panel.style.display = "none";
}

function updateMetric(labelId, fillId, labelPrefix, scorePercent) {
  const label = document.getElementById(labelId);
  const fill = document.getElementById(fillId);

  if (label && fill) {
    label.textContent = `${labelPrefix} (${scorePercent}%)`;
    fill.style.width = `${scorePercent}%`;
    fill.style.backgroundColor = getColorForScore(scorePercent);
  }
}

function updatePanel(promptText, data) {
  const panel = document.getElementById("floatingPromptPanel");
  if (!panel) return;

  if (promptText && data) {
    // Update emotion text
    document.getElementById("emotionText").innerHTML =
      `Emotion: ${data.emotion}<br>Intensity: ${data.intensity}`;

    const avgConf = Math.round((data.emotion_confidence + data.intensity_confidence) / 2);
    updateMetric("emoConfLabel", "scoreBarFill", "Confidence", avgConf);

    // Update Perplexity
    const perplexityScore = Math.min(100, Math.round(100 - data.perplexity)); // You might adjust scaling
    document.getElementById("perplexityText").textContent = `Perplexity: ${data.perplexity}`;
    updateMetric("perplexityLabel", "perplexityFill", "Confidence", perplexityScore);

    // Lexical Diversity
    const lexdivScore = Math.round(data.lexical_diversity * 100); // Assume between 0–1
    document.getElementById("lexdivText").textContent = `Lexical Diversity: ${data.lexical_diversity}`;
    updateMetric("lexdivLabel", "lexdivFill", "Confidence", lexdivScore);

    // Readability
    const readabilityScore = Math.round(data.readability_score); // Assume already percentage
    document.getElementById("readabilityText").textContent = `Readability: ${data.readability_score}`;
    updateMetric("readabilityLabel", "readabilityFill", "Confidence", readabilityScore);

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

/* 
{
  "emotion": {...},
  "perplexity": {...},
  "lexdiv": {...},
  "readability": {...}
}

setInterval(() => {
  const prompt = getPromptText();
  if (!prompt) return updatePanel("", null, null, null, null);

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
      updatePanel(
        prompt,
        data.emotion,       // Object with emotion_confidence, intensity_confidence, etc.
        data.perplexity,    // Object with perplexity value
        data.lexdiv,        // Object with lexical_diversity
        data.readability    // Object with readability_score
      );
    })
    .catch((err) => console.error("API error:", err));
}, 2500);

function updatePanel(promptText, emotionData, perplexityData, lexdivData, readabilityData) {
  const panel = document.getElementById("floatingPromptPanel");
  if (!panel) return;

  if (promptText && emotionData && perplexityData && lexdivData && readabilityData) {
    // Emotion
    const emotionText = document.getElementById("emotionText");
    const avgConf = Math.round(
      (emotionData.emotion_confidence + emotionData.intensity_confidence) / 2
    );
    emotionText.textContent = `Emotion & Intensity: ${emotionData.emotion}, ${emotionData.intensity}`;
    updateMetric("emoConfLabel", "scoreBarFill", "Confidence", avgConf);

    // Perplexity
    const perplexityScore = Math.min(100, Math.round(100 - perplexityData.perplexity)); // Normalize
    document.getElementById("perplexityText").textContent = `Perplexity: ${perplexityData.perplexity}`;
    updateMetric("perplexityLabel", "perplexityFill", "Score", perplexityScore);

    // Lexical Diversity
    const lexdivScore = Math.round(lexdivData.lexical_diversity * 100); // 0–1 to %
    document.getElementById("lexdivText").textContent = `Lexical Diversity: ${lexdivData.lexical_diversity}`;
    updateMetric("lexdivLabel", "lexdivFill", "Score", lexdivScore);

    // Readability
    const readabilityScore = Math.round(readabilityData.readability_score); // assume already a %
    document.getElementById("readabilityText").textContent = `Readability: ${readabilityData.readability_score}`;
    updateMetric("readabilityLabel", "readabilityFill", "Score", readabilityScore);

    panel.style.display = "block";
    positionPanel();
  } else {
    panel.style.display = "none";
  }
}
*/
