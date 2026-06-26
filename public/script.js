const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const chatBox = document.getElementById("chat-box");

const conversationHistory = [];

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userMessage = input.value.trim();
    if (!userMessage) return;

    appendMessage("user", userMessage);
    conversationHistory.push({ role: "user", text: userMessage });
    
    input.value = "";

    const thinkingMessageElem = appendMessage("bot", "Thinking...");

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ conversation: conversationHistory }),
        });

        if (!response.ok) {
            throw new Error(`Server returned HTTP status ${response.status}`);
        }

        const data = await response.json();

        if (data && data.result) {
            // FIX: Use innerHTML combined with your markdown parser here
            thinkingMessageElem.innerHTML = parseMarkdown(data.result);
            conversationHistory.push({ role: "model", text: data.result });
        } else {
            throw new Error("Invalid response format from server");
        }
    } catch (error) {
        console.error("Chat API Error:", error, "Response:", error.message, "+", error.log);
        thinkingMessageElem.textContent = "Failed to get response from server.";
        thinkingMessageElem.style.color = "#dc3545";
    }
});

function parseMarkdown(rawText) {
    // 1. Escape HTML characters safely
    let safeHtml = rawText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 2. Bold (**text**)
    safeHtml = safeHtml.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // 3. Italic (*text*)
    safeHtml = safeHtml.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // 4. Bullet list lines (e.g., "1.  Text" or "* Text")
    // Handles markdown lists cleanly
    safeHtml = safeHtml.replace(/^\s*[\*\-]\s+(.*)$/gm, "<li>$1</li>");
    safeHtml = safeHtml.replace(/^\s*\d+\.\s+(.*)$/gm, "<li>$1</li>");

    // 5. Paragraph splits and line breaks
    safeHtml = safeHtml.split(/\n{2,}/g).map(p => {
        if (p.includes("<li>")) {
            return `<ul>${p}</ul>`;
        }
        return `<p style="margin: 0 0 8px 0;">${p.replace(/\n/g, "<br>")}</p>`;
    }).join("");

    return safeHtml;
}

function appendMessage(sender, text) {
    const msg = document.createElement("div");
    msg.classList.add("message", sender);
    
    // Fallback block to handle clean parsing during dynamic streaming injections
    msg.innerHTML = parseMarkdown(text);
    
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    return msg;
}