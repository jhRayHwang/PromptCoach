let lastPrompt = "";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "PROMPT_UPDATE") {
    lastPrompt = message.prompt;
  }

  if (message.type === "GET_LAST_PROMPT") {
    sendResponse({ prompt: lastPrompt });
  }
});
