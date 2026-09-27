import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Store, Clock, MapPin, Phone, MessageSquare, 
  Sparkles, CheckCircle2, RefreshCw, Volume2, Globe, ArrowLeft,
  ShoppingBag, ShieldAlert, ExternalLink, HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import VoiceButton from '../components/VoiceButton';
import AudioPlayer from '../components/AudioPlayer';

const QUICK_SUGGESTIONS = {
  groceries: [
    { text: "Dukaan kab khulti hai aur kab band hoti hai?", label: "🕒 Shop Timings (Hindi)" },
    { text: "Kya home delivery available hai pass ke area mein?", label: "🚚 Home Delivery (Hinglish)" },
    { text: "Do you have Fortune Oil & Aashirvaad Atta in stock?", label: "📦 Stock Check (English)" },
    { text: "Payment kaise kar sakte hain, Google Pay chalega?", label: "💳 UPI / Cash (Hindi)" },
    { text: "ఈ రోజు దుకాణం తెరిచి ఉందా?", label: "🕒 Shop Open? (Telugu)" },
    { text: "ஹோம் டெலிவரி வசதி உள்ளதா?", label: "🚚 Home Delivery? (Tamil)" }
  ],
  pharmacy: [
    { text: "Do you provide Jan Aushadhi generic medicines at discount?", label: "💊 Generic Medicines (English)" },
    { text: "Dukaan khuli hai kya aur home delivery hogi?", label: "🕒 Timings & Delivery (Hindi)" },
    { text: "Kya prescription WhatsApp par bhej sakte hain?", label: "📋 Prescription (Hindi)" },
    { text: "BP aur Sugar check karne ki facility hai?", label: "🩺 Health Checkup (Hinglish)" }
  ],
  default: [
    { text: "Shop opening and closing timings?", label: "🕒 Timings" },
    { text: "Do you offer free home delivery?", label: "🚚 Delivery" },
    { text: "What payment methods are accepted?", label: "💳 Payments" },
    { text: "Dukaan kab khulti hai?", label: "🕒 दुकान समय (Hindi)" }
  ]
};

const LANG_LABELS = {
  hi: "🇮🇳 हिन्दी (Hindi)",
  te: "🇮🇳 తెలుగు (Telugu)",
  ta: "🇮🇳 தமிழ் (Tamil)",
  hinglish: "🇮🇳 Hinglish",
  en: "🌐 English"
};

export default function CustomerChat({ defaultShopId, onBackToDashboard }) {
  // Read query params from URL if available
  const urlParams = new URLSearchParams(window.location.search);
  const initialShopId = defaultShopId || urlParams.get('shop_id') || 'kirana-sharma';
  const isEmbedded = urlParams.get('embedded') === 'true';

  const [shopId, setShopId] = useState(initialShopId);
  const [shop, setShop] = useState(null);
  const [allShops, setAllShops] = useState([]);
  const [loadingShop, setLoadingShop] = useState(true);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState('hi');
  const [autoPlayAudio, setAutoPlayAudio] = useState(false);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load shop list for quick-switching in demo/standalone
  useEffect(() => {
    async function fetchShops() {
      try {
        const list = await api.getAllShops();
        setAllShops(list);
        if (list && list.length > 0) {
          // If current shopId is not in list, fallback to first shop
          if (!list.some(s => s.id === shopId)) {
            setShopId(list[0].id);
          }
        }
      } catch (e) {
        console.warn("Could not fetch shops list:", e);
      }
    }
    fetchShops();
  }, []);

  // Load specific shop profile
  useEffect(() => {
    async function loadShopData() {
      setLoadingShop(true);
      try {
        const data = await api.getShop(shopId);
        setShop(data);
        
        // Welcome message personalized for this shop
        setMessages([
          {
            id: 'welcome',
            sender: 'bot',
            text: `Namaste & Welcome to ${data.name}! 🙏\n\nI am your shop AI assistant. Ask me anything about store timings, item prices, stock availability, or home delivery in Hindi, Telugu, Tamil, or English.\n\nआप बोलकर (Voice Note) या लिखकर कुछ भी पूछ सकते हैं!`,
            language: 'en',
            is_fallback: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } catch (err) {
        console.error("Failed to load shop:", err);
      } finally {
        setLoadingShop(false);
      }
    }
    loadShopData();
  }, [shopId]);

  // Handle sending a customer query
  const handleSendMessage = async (textToSend, isVoiceQuery = false) => {
    const q = (textToSend || inputText).trim();
    if (!q || isSending) return;

    const userMsgId = 'user_' + Date.now();
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text: q,
      isVoice: isVoiceQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const res = await api.sendChatMessage(shopId, q, isVoiceQuery);

      const botMsg = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        query: q,
        text: res.answer,
        language: res.language || 'en',
        confidence: res.confidence,
        is_fallback: res.is_fallback || false,
        shop_owner: res.shop_owner || shop?.owner,
        shop_phone: res.shop_phone || shop?.phone,
        matched_faq: res.matched_faq,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);

      // If autoPlay is enabled, speak bot answer
      if (autoPlayAudio && ('speechSynthesis' in window)) {
        window.speechSynthesis.cancel();
        const clean = res.answer.replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{1F1E0}-\u{1F1FF}]/gu, '');
        const utterance = new SpeechSynthesisUtterance(clean);
        const langMap = { hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', en: 'en-IN', hinglish: 'hi-IN' };
        utterance.lang = langMap[res.language] || 'hi-IN';
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error("Chat query error:", err);
      const errorMsg = {
        id: 'bot_' + Date.now(),
        sender: 'bot',
        text: "Maaf kijiye, abhi server se connect hone mein samasya ho rahi hai. Please thodi der baad prayas karein.",
        language: 'hinglish',
        is_fallback: true,
        shop_owner: shop?.owner,
        shop_phone: shop?.phone,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceTranscript = (transcript) => {
    if (transcript && transcript.trim()) {
      setInputText(transcript);
      // Auto-send voice input for seamless natural interaction
      handleSendMessage(transcript, true);
    }
  };

  const cleanPhoneForWhatsApp = (phoneStr) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/[^0-9]/g, '');
    if (digits.length === 10) return '91' + digits;
    return digits;
  };

  // Select suggestion chips based on category
  const currentCategory = shop?.category?.toLowerCase() || '';
  const suggestions = currentCategory.includes('pharma') 
    ? QUICK_SUGGESTIONS.pharmacy 
    : currentCategory.includes('grocer') || currentCategory.includes('kirana')
      ? QUICK_SUGGESTIONS.groceries
      : QUICK_SUGGESTIONS.default;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col ${isEmbedded ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div className={`max-w-3xl w-full mx-auto flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden ${isEmbedded ? 'rounded-none border-none' : ''}`}>
        
        {/* Top Header / Shop Profile */}
        <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 sm:px-6 sm:py-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors mr-1"
                title="Back to Shop Dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Store className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {shop?.name || 'Loading Shop...'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Dukaan
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                {shop?.timings && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    {shop.timings}
                  </span>
                )}
                {shop?.phone && (
                  <a href={`tel:${shop.phone}`} className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-teal-400" />
                    {shop.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Shop Switcher & Voice Language Selector */}
          <div className="flex items-center gap-2 ml-auto">
            {allShops.length > 1 && !isEmbedded && (
              <div className="relative">
                <select
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                  className="bg-slate-800/80 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors"
                  title="Switch Demo Shop"
                >
                  {allShops.map((s) => (
                    <option key={s.id} value={s.id}>
                      🏪 {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative flex items-center">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <select
                value={selectedVoiceLang}
                onChange={(e) => setSelectedVoiceLang(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                title="Select Voice Language"
              >
                <option value="hi">हिन्दी (Hindi)</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="ta">தமிழ் (Tamil)</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </header>

        {/* Shop Address & Delivery Notice Banner */}
        {shop && (
          <div className="bg-slate-800/40 border-b border-slate-800/60 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <span className="inline-flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span className="truncate">{shop.address || 'Local Market'}</span>
            </span>
            {shop.delivery_rules && (
              <span className="inline-flex items-center gap-1.5 text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
                <ShoppingBag className="w-3 h-3" />
                {shop.delivery_rules}
              </span>
            )}
          </div>
        )}

        {/* Chat Messages Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 shadow-md transition-all ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white rounded-tr-none'
                    : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none'
                }`}
              >
                {/* Bot Header (Avatar + Detected Language) */}
                {msg.sender === 'bot' && (
                  <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        🤖
                      </div>
                      <span className="text-xs font-semibold text-emerald-400">
                        {shop?.name || 'DukaanBot'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.language && (
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-full border border-slate-700">
                          {LANG_LABELS[msg.language] || msg.language}
                        </span>
                      )}
                      {msg.confidence > 0 && (
                        <span className="text-[10px] text-teal-400 font-mono">
                          {msg.confidence}% match
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message Text */}
                <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                  {msg.text}
                </p>

                {/* Bot Audio Player Action */}
                {msg.sender === 'bot' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
                    <AudioPlayer 
                      text={msg.text} 
                      lang={msg.language || selectedVoiceLang} 
                      label="Sunna (Listen)"
                    />
                    <span className="text-[10px] text-slate-400">
                      {msg.timestamp}
                    </span>
                  </div>
                )}

                {/* User Message Timestamp */}
                {msg.sender === 'user' && (
                  <div className="flex items-center justify-end gap-1.5 text-[10px] text-emerald-200/80 mt-1">
                    {msg.isVoice && <span>🎙️ Voice Note •</span>}
                    <span>{msg.timestamp}</span>
                  </div>
                )}

                {/* Fallback to Shop Owner Card */}
                {msg.is_fallback && (
                  <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                    <div className="flex items-center gap-2 font-semibold text-xs text-amber-300 mb-1">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      Direct Shopkeeper Connect:
                    </div>
                    <p className="text-xs text-amber-200/90 mb-3">
                      This question is not in the automatic FAQ. You can connect directly with {msg.shop_owner || shop?.owner || 'the shop owner'}:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/${cleanPhoneForWhatsApp(msg.shop_phone || shop?.phone)}?text=Namaste%20${encodeURIComponent(shop?.owner || 'Bhaiya')},%20I%20have%20a%20question%20regarding%20${encodeURIComponent(shop?.name || 'your store')}:%20${encodeURIComponent(msg.query || '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Chat on WhatsApp
                      </a>

                      <a
                        href={`tel:${msg.shop_phone || shop?.phone}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold text-xs shadow-md transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        Call Shop Directly
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing / Query Processing Indicator */}
          {isSending && (
            <div className="flex items-center gap-3 text-slate-400 text-xs py-2 px-3 bg-slate-800/60 rounded-xl w-fit border border-slate-700/50 animate-pulse">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>DukaanBot is checking FAQs & preparing response in your local language...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Suggestion Chips */}
        <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-2.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
              <HelpCircle className="w-3 h-3 text-emerald-400" />
              Quick Questions:
            </span>
            {suggestions.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.text)}
                disabled={isSending}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <span>{chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar with Mic & Send */}
        <footer className="bg-slate-900 border-t border-slate-800 p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Input Button */}
            <VoiceButton
              currentLang={selectedVoiceLang}
              onTranscript={handleVoiceTranscript}
            />

            {/* Query Input Field */}
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or speak: Dukaan kab khulti hai? Aata price? Home delivery?..."
                disabled={isSending}
                className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-2xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder:text-slate-500"
              />
              {inputText && (
                <button
                  type="button"
                  onClick={() => setInputText('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
                inputText.trim() && !isSending
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-slate-950 font-bold hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95'
                  : 'bg-slate-800 text-slate-600 cursor-not-allowed'
              }`}
              title="Send Message"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Footer Branding & Disclaimer */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Local Voice AI Engine • Web Speech API
            </span>
            <span className="hidden sm:inline">
              Available in Hindi, Telugu, Tamil, & English
            </span>
          </div>
        </footer>

      </div>
    </div>
  );
}
