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

function getColorForScore(scorePercent, invert = false) {
  if (!invert) {
    if (scorePercent >= 80) return "#10B981";  // green
    if (scorePercent >= 60) return "#84cc16";  // yellow-green
    if (scorePercent >= 40) return "#e0e578";  // yellow
    if (scorePercent >= 20) return "#f59e0b";  // orange
    return "#ef4444";                          // red
  } else {
    // Inverted colors: high score = bad (red)
    if (scorePercent >= 80) return "#ef4444";  // red
    if (scorePercent >= 60) return "#f59e0b";  // orange
    if (scorePercent >= 40) return "#e0e578";  // yellow
    if (scorePercent >= 20) return "#84cc16";  // yellow-green
    return "#10B981";                          // green
  }
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

  const recommendationsTitle = document.createElement("div");
  recommendationsTitle.textContent = "Recommendations";
  recommendationsTitle.style.fontWeight = "bold";
  recommendationsTitle.style.marginBottom = "6px";
  recommendationsTitle.style.textAlign = "center";
  panel.appendChild(recommendationsTitle);

  const recommendationsDiv = document.createElement("div");
  recommendationsDiv.id = "recommendationsDiv";  // so you can update it later
  panel.appendChild(recommendationsDiv);

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

function updateMetric(labelId, fillId, labelPrefix, scorePercent, invertColor = false) {
  const label = document.getElementById(labelId);
  const fill = document.getElementById(fillId);

  if (label && fill) {
    label.textContent = `${labelPrefix} (${scorePercent}%)`;
    fill.style.width = `${scorePercent}%`;
    fill.style.backgroundColor = getColorForScore(scorePercent, invertColor);
  }
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
  joyful: {
    perplexity: "💡 Stay focused—joyful language can drift off-topic.",
    lexical_diversity: "💡 Keep cheerful language balanced and clear.",
    readability: "💡 Joy can get wordy—trim excess excitement.",
  },
  gratitude: {
    perplexity: "💡 Make thanks specific—vagueness raises complexity.",
    lexical_diversity: "💡 Combine warmth with clarity in phrasing.",
    readability: "💡 Keep appreciation direct and concise.",
  },
  hopeful: {
    perplexity: "💡 Hopeful prompts may overreach—ground them clearly.",
    lexical_diversity: "💡 Vary optimistic phrases to stay natural.",
    readability: "💡 Aim for clarity—too much hope can obscure purpose.",
  }
};

function showSuggestions(emotionKey, metrics) {
  const suggestions = suggestionsMap[emotionKey.toLowerCase()];
  if (!suggestions) return "";

  let text = "";

  // Apply thresholds:
  // readability < 77.81
  if (metrics.readability < 77.81 && suggestions.readability) {
    text += `Readability: ${suggestions.readability}\n`;
  }
  // lexical_diversity < 0.62
  if (metrics.lexical_diversity < 0.62 && suggestions.lexical_diversity) {
    text += `Lexical Diversity: ${suggestions.lexical_diversity}\n`;
  }
  // perplexity > 36.29
  if (metrics.perplexity > 36.29 && suggestions.perplexity) {
    text += `Perplexity: ${suggestions.perplexity}\n`;
  }

  return text.trim();
}

function updatePanel(promptText, data) {
  const panel = document.getElementById("floatingPromptPanel");
  if (!panel) return;

  // Clear old suggestions container or create it if missing
  let suggestionsContainer = document.getElementById("suggestionsContainer");
  if (!suggestionsContainer) {
    suggestionsContainer = document.createElement("div");
    suggestionsContainer.id = "suggestionsContainer";
    suggestionsContainer.style.marginTop = "10px";
    suggestionsContainer.style.whiteSpace = "pre-line"; // keep line breaks
    panel.appendChild(suggestionsContainer);
  }
  suggestionsContainer.innerHTML = ""; // clear previous suggestions

  if (promptText && data) {
    // Update emotion text
    const emotionDiv = document.getElementById("emotionText");
    if (emotionDiv)
      emotionDiv.innerHTML = `Emotion: ${data.emotion}<br>Intensity: ${data.intensity}`;

    // Average confidence for emotion
    const avgConf = Math.round((data.emotion_confidence + data.intensity_confidence) / 2);
    updateMetric("emoConfLabel", "scoreBarFill", "Confidence", avgConf);

    // Perplexity
    const perplexityDiv = document.getElementById("perplexityText");
    if (perplexityDiv)
      perplexityDiv.textContent = `Perplexity: ${data.perplexity}`;
    updateMetric("perplexityLabel", "perplexityFill", "Score", data.perplexity_percent, true);  // invert colors here

    // Lexical Diversity
    const lexdivDiv = document.getElementById("lexdivText");
    if (lexdivDiv)
      lexdivDiv.textContent = `Lexical Diversity: ${data.lex_diversity}`;
    updateMetric("lexdivLabel", "lexdivFill", "Score", data.lex_div_percent);

    // Readability
    const readabilityDiv = document.getElementById("readabilityText");
    if (readabilityDiv)
      readabilityDiv.textContent = `Readability: ${data.readability}`;
    updateMetric("readabilityLabel", "readabilityFill", "Score", data.readability_percent);

    // Generate dynamic recommendations based on emotion and metric scores
    const emotionKey = data.emotion.toLowerCase();
    const metrics = {
      perplexity: data.perplexity_percent,
      lexical_diversity: data.lex_div_percent,
      readability: data.readability_percent,
    };

    const suggestions = suggestionsMap[emotionKey];
      if (suggestions) {
        const applicableSuggestions = [];
        for (const metric in metrics) {
          const score = metrics[metric];

          if (metric === "perplexity" && score > 36.29 && suggestions[metric]) {
            applicableSuggestions.push({ metric, text: suggestions[metric] });
          } else if (metric === "lexical_diversity" && score < 0.62 && suggestions[metric]) {
            applicableSuggestions.push({ metric, text: suggestions[metric] });
          } else if (metric === "readability" && score < 77.81 && suggestions[metric]) {
            applicableSuggestions.push({ metric, text: suggestions[metric] });
          }
        }

    if (applicableSuggestions.length > 0) {

      applicableSuggestions.forEach(({ metric, text }) => {
        const suggestionDiv = document.createElement("div");

        // Capitalize metric and replace underscores with spaces nicely
        const metricLabel = metric
          .split("_")
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        suggestionDiv.textContent = `${metricLabel}: ${text}`;
        suggestionDiv.style.marginBottom = "4px";
        suggestionDiv.style.fontSize = "13px";

        suggestionsContainer.appendChild(suggestionDiv);
      });
    }
  }

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