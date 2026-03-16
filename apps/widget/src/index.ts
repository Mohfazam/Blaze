import { injectStyles } from "./styles"
import { buildWidget, addMessage } from "./ui"
import { askQuestion, submitEmail } from "./api"

const script = document.currentScript as HTMLScriptElement
const siteId = script?.getAttribute("data-site-id") ?? ""

injectStyles()
const { bubble, panel, messages, input, sendBtn, emailCapture, emailInput, emailBtn } = buildWidget()

let isOpen = false
let lastQuestion = ""
let lastLanguage = "en"

// Toggle panel
bubble.addEventListener("click", () => {
  isOpen = !isOpen
  panel.classList.toggle("open", isOpen)
  if (isOpen) input.focus()
})

// Send question
async function sendQuestion() {
  const question = input.value.trim()
  if (!question || !siteId) return

  lastQuestion = question
  input.value = ""
  emailCapture.classList.remove("visible")

  addMessage(messages, question, "user")
  const typing = addMessage(messages, "Thinking...", "typing")

  try {
    const result = await askQuestion(siteId, question)
    typing.remove()

    if (result.needsEmail) {
      addMessage(messages, "I couldn't find an answer to that.", "bot")
      emailCapture.classList.add("visible")
    } else {
      lastLanguage = result.language ?? "en"
      addMessage(messages, result.answer, "bot")
    }
  } catch {
    typing.remove()
    addMessage(messages, "Something went wrong. Please try again.", "bot")
  }
}

sendBtn.addEventListener("click", sendQuestion)
input.addEventListener("keydown", (e) => { if (e.key === "Enter") sendQuestion() })

// Email capture
emailBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim()
  if (!email) return

  await submitEmail(siteId, lastQuestion, email, lastLanguage)
  emailCapture.classList.remove("visible")
  emailInput.value = ""
  addMessage(messages, "Got it! We'll follow up with you shortly ✉️", "bot")
})