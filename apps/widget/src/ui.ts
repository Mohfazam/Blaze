export function buildWidget(): {
  bubble: HTMLElement
  panel: HTMLElement
  messages: HTMLElement
  input: HTMLInputElement
  sendBtn: HTMLElement
  emailCapture: HTMLElement
  emailInput: HTMLInputElement
  emailBtn: HTMLElement
} {
  const wrapper = document.createElement("div")
  wrapper.id = "blaze-widget"

  wrapper.innerHTML = `
    <button id="blaze-bubble" aria-label="Open chat">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <div id="blaze-panel">
      <div id="blaze-header">
        <div class="dot"></div>
        <span>Ask anything</span>
      </div>
      <div id="blaze-messages">
        <div class="blaze-msg bot">Hi! Ask me anything about this website 👋</div>
      </div>
      <div id="blaze-email-capture">
        <p>We couldn't find an answer. Leave your email and we'll follow up.</p>
        <input id="blaze-email-input" type="email" placeholder="your@email.com" />
        <button id="blaze-email-btn">Notify me</button>
      </div>
      <div id="blaze-input-row">
        <input id="blaze-input" type="text" placeholder="Type your question..." />
        <button id="blaze-send">Send</button>
      </div>
    </div>
  `

  document.body.appendChild(wrapper)

  return {
    bubble: document.getElementById("blaze-bubble")!,
    panel: document.getElementById("blaze-panel")!,
    messages: document.getElementById("blaze-messages")!,
    input: document.getElementById("blaze-input") as HTMLInputElement,
    sendBtn: document.getElementById("blaze-send")!,
    emailCapture: document.getElementById("blaze-email-capture")!,
    emailInput: document.getElementById("blaze-email-input") as HTMLInputElement,
    emailBtn: document.getElementById("blaze-email-btn")!
  }
}

export function addMessage(container: HTMLElement, text: string, type: "bot" | "user" | "typing") {
  const msg = document.createElement("div")
  msg.className = `blaze-msg ${type}`
  msg.textContent = text
  container.appendChild(msg)
  container.scrollTop = container.scrollHeight
  return msg
}