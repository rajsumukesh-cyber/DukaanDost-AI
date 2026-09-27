/**
 * DukaanBot Universal Embeddable Widget Script
 * Injected on small business websites to render floating multilingual AI voice assistant
 * Usage:
 * <script src="http://localhost:8000/widget.js" data-shop-id="shop_kirana_01" data-color="#10B981"></script>
 */
(function() {
  // Prevent duplicate injection
  if (window.__DUKAANBOT_INITIALIZED__) return;
  window.__DUKAANBOT_INITIALIZED__ = true;

  // Find the calling script tag to extract attributes
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var shopId = (currentScript && currentScript.getAttribute('data-shop-id')) || 'kirana-sharma';
  var widgetColor = (currentScript && currentScript.getAttribute('data-color')) || '#10B981';
  var hostUrl = (currentScript && currentScript.src) ? new URL(currentScript.src).origin : window.location.origin;

  // Iframe target URL
  var chatUrl = hostUrl + '/?shop_id=' + encodeURIComponent(shopId) + '&embedded=true#customer-chat';

  // Inject Widget Styles
  var style = document.createElement('style');
  style.innerHTML = `
    .dukaanbot-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${widgetColor};
      color: #ffffff;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 2px 6px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 999999;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    .dukaanbot-bubble:hover {
      transform: scale(1.08);
      box-shadow: 0 12px 28px rgba(16, 185, 129, 0.35);
    }
    .dukaanbot-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #ef4444;
      color: white;
      font-size: 10px;
      font-weight: bold;
      border-radius: 9999px;
      padding: 2px 6px;
      border: 2px solid white;
      animation: dukaanPulse 2s infinite;
    }
    .dukaanbot-modal {
      position: fixed;
      bottom: 96px;
      right: 24px;
      width: 400px;
      max-width: calc(100vw - 32px);
      height: 620px;
      max-height: calc(100vh - 120px);
      background: #090d16;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1);
      overflow: hidden;
      z-index: 999998;
      display: none;
      flex-direction: column;
      animation: dukaanSlideUp 0.3s ease-out forwards;
    }
    .dukaanbot-modal.open {
      display: flex;
    }
    .dukaanbot-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    @keyframes dukaanSlideUp {
      from { opacity: 0; transform: translateY(20px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes dukaanPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.15); }
    }
  `;
  document.head.appendChild(style);

  // Create Container Elements
  var bubble = document.createElement('div');
  bubble.className = 'dukaanbot-bubble';
  bubble.setAttribute('aria-label', 'Open DukaanBot Voice Assistant');
  bubble.innerHTML = `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
    <span class="dukaanbot-badge">AI</span>
  `;

  var modal = document.createElement('div');
  modal.className = 'dukaanbot-modal';

  var iframe = document.createElement('iframe');
  iframe.className = 'dukaanbot-iframe';
  iframe.src = chatUrl;
  iframe.allow = 'microphone';
  modal.appendChild(iframe);

  document.body.appendChild(bubble);
  document.body.appendChild(modal);

  // Toggle Chat
  var isOpen = false;
  bubble.addEventListener('click', function() {
    isOpen = !isOpen;
    if (isOpen) {
      modal.classList.add('open');
      bubble.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
    } else {
      modal.classList.remove('open');
      bubble.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span class="dukaanbot-badge">AI</span>
      `;
    }
  });

})();
