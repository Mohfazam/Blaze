export function injectStyles() {
  const style = document.createElement("style")
  style.textContent = `
    #blaze-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'DM Sans', sans-serif; }

    #blaze-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 56px; height: 56px; border-radius: 50%;
      background: #0f0f0f; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.18);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    #blaze-bubble:hover { transform: scale(1.08); box-shadow: 0 8px 32px rgba(0,0,0,0.22); }
    #blaze-bubble svg { width: 24px; height: 24px; }

    #blaze-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 99999;
      width: 360px; height: 500px;
      background: #ffffff; border-radius: 20px;
      box-shadow: 0 8px 48px rgba(0,0,0,0.14);
      display: flex; flex-direction: column;
      overflow: hidden; opacity: 0; pointer-events: none;
      transform: translateY(12px) scale(0.97);
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    #blaze-panel.open { opacity: 1; pointer-events: all; transform: translateY(0) scale(1); }

    #blaze-header {
      background: #0f0f0f; padding: 18px 20px;
      display: flex; align-items: center; gap: 10px;
    }
    #blaze-header .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
    #blaze-header span { color: #fff; font-size: 14px; font-weight: 600; letter-spacing: 0.01em; }

    #blaze-messages {
      flex: 1; overflow-y: auto; padding: 20px;
      display: flex; flex-direction: column; gap: 12px;
    }

    .blaze-msg {
      max-width: 85%; padding: 10px 14px;
      border-radius: 14px; font-size: 13.5px; line-height: 1.5;
    }
    .blaze-msg.bot { background: #f4f4f5; color: #0f0f0f; align-self: flex-start; border-bottom-left-radius: 4px; }
    .blaze-msg.user { background: #0f0f0f; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
    .blaze-msg.typing { color: #999; font-style: italic; }

    #blaze-email-capture {
      padding: 16px 20px; border-top: 1px solid #f0f0f0;
      display: none; flex-direction: column; gap: 8px;
    }
    #blaze-email-capture.visible { display: flex; }
    #blaze-email-capture p { font-size: 12.5px; color: #666; }
    #blaze-email-input {
      border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 9px 13px; font-size: 13px; outline: none;
      transition: border-color 0.15s;
    }
    #blaze-email-input:focus { border-color: #0f0f0f; }
    #blaze-email-btn {
      background: #0f0f0f; color: #fff; border: none;
      border-radius: 10px; padding: 9px; font-size: 13px;
      font-weight: 600; cursor: pointer; transition: opacity 0.15s;
    }
    #blaze-email-btn:hover { opacity: 0.85; }

    #blaze-input-row {
      padding: 14px 16px; border-top: 1px solid #f0f0f0;
      display: flex; gap: 8px;
    }
    #blaze-input {
      flex: 1; border: 1.5px solid #e5e7eb; border-radius: 10px;
      padding: 9px 13px; font-size: 13px; outline: none;
      transition: border-color 0.15s;
    }
    #blaze-input:focus { border-color: #0f0f0f; }
    #blaze-send {
      background: #0f0f0f; color: #fff; border: none;
      border-radius: 10px; padding: 9px 14px; cursor: pointer;
      font-size: 13px; font-weight: 600; transition: opacity 0.15s;
    }
    #blaze-send:hover { opacity: 0.85; }

    @media (max-width: 420px) {
      #blaze-panel { width: calc(100vw - 24px); right: 12px; bottom: 80px; }
    }
  `
  document.head.appendChild(style)
}