/**
 * DukaanDost Main Application Controller
 * Orchestrates Store Management, RAG AI Query Pipeline, Voice Recording,
 * WhatsApp Chat Importer, and Fallback Notifications.
 */

class DukaanApp {
    constructor() {
        this.currentShopId = 'kirana';
        this.currentShop = null;
        this.currentLanguage = 'hinglish';
        this.activeFilter = 'all';
        this.chatMessages = [];
        this.fallbackQueries = [];
        this.extractedCandidateFaqs = [];
        this.isRecording = false;
        this.currentVoiceTranscript = '';

        this.init();
    }

    init() {
        this.loadShop(this.currentShopId);
        this.setupClock();
        this.setupDragAndDrop();
    }

    /**
     * Load shop state from LocalStorage or default sample database
     */
    loadShop(shopId) {
        this.currentShopId = shopId;
        const storedShop = localStorage.getItem(`dukaan_shop_${shopId}`);
        if (storedShop) {
            try {
                this.currentShop = JSON.parse(storedShop);
            } catch (e) {
                this.currentShop = JSON.parse(JSON.stringify(SAMPLE_SHOPS[shopId]));
            }
        } else {
            this.currentShop = JSON.parse(JSON.stringify(SAMPLE_SHOPS[shopId]));
        }

        this.renderShopHeader();
        this.renderFaqList();
        this.renderStoreRules();
        this.resetWhatsAppChat();
        this.updateQuickChips();
    }

    saveCurrentShop() {
        if (this.currentShop) {
            localStorage.setItem(`dukaan_shop_${this.currentShopId}`, JSON.stringify(this.currentShop));
        }
    }

    switchShop(shopId) {
        this.loadShop(shopId);
        const demoSelect = document.getElementById('demo-chat-select');
        if (demoSelect) demoSelect.value = shopId;
        const activeSelect = document.getElementById('active-shop-select');
        if (activeSelect) activeSelect.value = shopId;
        console.log(`Switched to shop: ${this.currentShop.name}`);
    }

    changeLanguage(lang) {
        this.currentLanguage = lang;
        if (this.currentShop) {
            this.renderFaqList();
        }
    }

    setupClock() {
        const update = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const mins = now.getMinutes().toString().padStart(2, '0');
            const clockEl = document.getElementById('phone-clock');
            if (clockEl) clockEl.textContent = `${hours}:${mins}`;
        };
        update();
        setInterval(update, 30000);
    }

    renderShopHeader() {
        const s = this.currentShop;
        if (!s) return;

        // Left dashboard header card
        document.getElementById('shop-hero-avatar').src = s.avatar;
        document.getElementById('shop-hero-name').textContent = s.name;
        document.getElementById('shop-hero-tagline').textContent = s.tagline;
        document.getElementById('shop-hero-timings').textContent = s.timings;
        document.getElementById('shop-hero-delivery').textContent = s.deliveryMinOrder;
        document.getElementById('shop-hero-upi').textContent = s.upiId;

        // Right phone mockup header
        document.getElementById('wa-header-avatar').src = s.avatar;
        document.getElementById('wa-header-name').textContent = s.name;
        document.getElementById('faq-count-badge').textContent = (s.faqs || []).length;
    }

    /**
     * Render FAQs in the dashboard
     */
    renderFaqList() {
        const container = document.getElementById('faq-list-container');
        if (!container) return;

        const faqs = this.currentShop.faqs || [];
        const filtered = this.activeFilter === 'all' 
            ? faqs 
            : faqs.filter(f => f.category === this.activeFilter);

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2.5rem 1rem; color: #8696A0;">
                    <i class="fa-solid fa-box-open" style="font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <p>No FAQs found in this category.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(faq => {
            const isHindi = this.currentLanguage === 'hi';
            const displayQuestion = isHindi && faq.questionHi ? faq.questionHi : faq.question;
            const displayAnswer = isHindi && faq.answerHi ? faq.answerHi : faq.answer;
            const keywords = faq.keywords || [];

            return `
                <div class="faq-card" id="card-${faq.id}">
                    <div class="faq-card-header">
                        <span class="faq-category-tag">${faq.category || 'General'}</span>
                        <div class="faq-actions">
                            <button class="btn-icon" title="Edit FAQ" onclick="window.dukaanApp.openEditFaqModal('${faq.id}')">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn-icon delete" title="Delete FAQ" onclick="window.dukaanApp.deleteFaq('${faq.id}')">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="faq-question">${displayQuestion}</div>
                    <div class="faq-answer">
                        <i class="fa-solid fa-quote-left" style="color: #25D366; font-size: 0.75rem; margin-right: 0.4rem;"></i>
                        ${displayAnswer}
                    </div>
                    <div class="faq-keywords">
                        ${keywords.map(kw => `<span class="keyword-tag">#${kw}</span>`).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    filterFaqs(category, btnElement) {
        this.activeFilter = category;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        if (btnElement) btnElement.classList.add('active');
        this.renderFaqList();
    }

    /**
     * Tabs Switching
     */
    showTab(tabName, btnElement) {
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

        const targetPane = document.getElementById(`tab-${tabName}`);
        if (targetPane) targetPane.classList.add('active');
        if (btnElement) btnElement.classList.add('active');
    }

    /**
     * Modal Operations for Add/Edit FAQ
     */
    openAddFaqModal() {
        document.getElementById('faq-modal-title').textContent = 'Add FAQ to Knowledge Base';
        document.getElementById('modal-faq-id').value = '';
        document.getElementById('modal-faq-category').value = 'timings';
        document.getElementById('modal-faq-question').value = '';
        document.getElementById('modal-faq-question-hi').value = '';
        document.getElementById('modal-faq-answer').value = '';
        document.getElementById('modal-faq-answer-hi').value = '';
        document.getElementById('modal-faq-keywords').value = '';

        document.getElementById('faq-modal').classList.add('show');
    }

    openEditFaqModal(faqId) {
        const faq = (this.currentShop.faqs || []).find(f => f.id === faqId);
        if (!faq) return;

        document.getElementById('faq-modal-title').textContent = 'Edit Knowledge Base FAQ';
        document.getElementById('modal-faq-id').value = faq.id;
        document.getElementById('modal-faq-category').value = faq.category || 'general';
        document.getElementById('modal-faq-question').value = faq.question;
        document.getElementById('modal-faq-question-hi').value = faq.questionHi || '';
        document.getElementById('modal-faq-answer').value = faq.answer;
        document.getElementById('modal-faq-answer-hi').value = faq.answerHi || '';
        document.getElementById('modal-faq-keywords').value = (faq.keywords || []).join(', ');

        document.getElementById('faq-modal').classList.add('show');
    }

    closeFaqModal() {
        document.getElementById('faq-modal').classList.remove('show');
    }

    saveFaqFromModal() {
        const id = document.getElementById('modal-faq-id').value;
        const category = document.getElementById('modal-faq-category').value;
        const question = document.getElementById('modal-faq-question').value.trim();
        const questionHi = document.getElementById('modal-faq-question-hi').value.trim();
        const answer = document.getElementById('modal-faq-answer').value.trim();
        const answerHi = document.getElementById('modal-faq-answer-hi').value.trim();
        const rawKeywords = document.getElementById('modal-faq-keywords').value;
        const keywords = rawKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);

        if (!question || !answer) return;

        if (id) {
            // Update existing
            const index = this.currentShop.faqs.findIndex(f => f.id === id);
            if (index !== -1) {
                this.currentShop.faqs[index] = {
                    ...this.currentShop.faqs[index],
                    category, question, questionHi, answer, answerHi, keywords
                };
            }
        } else {
            // Add new
            const newFaq = {
                id: `faq-${Date.now()}`,
                category, question, questionHi, answer, answerHi, keywords
            };
            this.currentShop.faqs.unshift(newFaq);
        }

        this.saveCurrentShop();
        this.renderFaqList();
        this.renderShopHeader();
        this.closeFaqModal();
    }

    deleteFaq(faqId) {
        if (confirm("Kya aap sach me ye FAQ delete karna chahte hain?")) {
            this.currentShop.faqs = this.currentShop.faqs.filter(f => f.id !== faqId);
            this.saveCurrentShop();
            this.renderFaqList();
            this.renderShopHeader();
        }
    }

    /**
     * Store Rules Profile Form
     */
    renderStoreRules() {
        const s = this.currentShop;
        if (!s) return;
        document.getElementById('rule-shop-name').value = s.name || '';
        document.getElementById('rule-owner-name').value = s.owner || '';
        document.getElementById('rule-phone').value = s.phone || '';
        document.getElementById('rule-upi').value = s.upiId || '';
        document.getElementById('rule-timings').value = s.timings || '';
        document.getElementById('rule-min-delivery').value = s.deliveryMinOrder || '';
        document.getElementById('rule-radius').value = s.deliveryRadius || '';
        document.getElementById('rule-delivery-time').value = s.deliveryTime || '';
        document.getElementById('rule-address').value = s.address || '';
    }

    saveStoreRules() {
        const s = this.currentShop;
        s.name = document.getElementById('rule-shop-name').value;
        s.owner = document.getElementById('rule-owner-name').value;
        s.phone = document.getElementById('rule-phone').value;
        s.upiId = document.getElementById('rule-upi').value;
        s.timings = document.getElementById('rule-timings').value;
        s.deliveryMinOrder = document.getElementById('rule-min-delivery').value;
        s.deliveryRadius = document.getElementById('rule-radius').value;
        s.deliveryTime = document.getElementById('rule-delivery-time').value;
        s.address = document.getElementById('rule-address').value;

        this.saveCurrentShop();
        this.renderShopHeader();
        alert("Store settings saved successfully! AI knowledge base updated.");
    }

    /**
     * Auto-FAQ Generator (WhatsApp Importer)
     */
    setupDragAndDrop() {
        const dropZone = document.getElementById('chat-drop-zone');
        if (!dropZone) return;

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('chat-export-input').value = event.target.result;
                    this.runAutoFaqExtraction();
                };
                reader.readAsText(files[0]);
            }
        });
    }

    loadSelectedDemoChat(chatKey) {
        if (!chatKey) return;
        const sampleText = SAMPLE_CHAT_LOGS[chatKey] || SAMPLE_CHAT_LOGS['kirana'];
        if (sampleText) {
            document.getElementById('chat-export-input').value = sampleText;
            const selectEl = document.getElementById('demo-chat-select');
            if (selectEl) selectEl.value = chatKey;
            this.runAutoFaqExtraction();
        }
    }

    loadSampleChat() {
        this.loadSelectedDemoChat(this.currentShopId || 'kirana');
    }

    updateQuickChips() {
        const bar = document.getElementById('quick-chips-bar');
        if (!bar) return;

        if (this.currentShopId === 'pharmacy') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Pharmacy opening hours kya hain?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Dolo 650 aur BP machine mil jayegi?')">💊 Dolo 650 & BP Machine?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Medicine ki home delivery karte ho?')">🚚 Medicine Delivery?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Pampers baby diapers available hain?')">👶 Baby Diapers?</button>
            `;
        } else if (this.currentShopId === 'garments') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Boutique timings aur weekly off kab hai?')">⏰ Boutique Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Designer blouse stitching facility hai?')">👗 Blouse Stitching?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Exchange ya return policy kya hai?')">🔄 Return Policy?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('All India delivery karte ho?')">📦 Shipping?</button>
            `;
        } else if (this.currentShopId === 'hardware') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Hardware store ke opening hours kya hain?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Philips LED bulb aur wire coil ka kya rate hai?')">💡 LED Bulb & Wire?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Ghar par plumber visit karta hai kya?')">🔧 Plumber Visit?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('UltraTech cement delivery mil sakti hai?')">🧱 Cement Delivery?</button>
            `;
        } else if (this.currentShopId === 'bakery') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Subah nashta kitne baje milta hai?')">⏰ Morning Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Chocolate Truffle cake customize ho sakta hai?')">🎂 Customized Cake?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Kaju Katli fresh rate kya hai?')">🍬 Kaju Katli Rate?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Garam Samosa bulk order deliver kar doge?')">🥟 Samosa Order?</button>
            `;
        } else if (this.currentShopId === 'mobile_repair') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Mobile repair shop timings kya hain?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Display screen replacement ka kitna kharcha aayega?')">📱 Display Replacement?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('iPhone original 20W charger available hai?')">🔌 Fast Charger?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('UV curved tempered glass lagwana hai')">🛡️ UV Glass?</button>
            `;
        } else if (this.currentShopId === 'stationery') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Stationery dukaan kab khulti hai?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('WhatsApp PDF bhejne par printout mil jayega?')">📄 Printout Rate?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Spiral binding aur Hardcover binding ka rate kya hai?')">📚 Binding?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Urgent passport size photo ban jayegi?')">📸 Passport Photo?</button>
            `;
        } else if (this.currentShopId === 'south_indian') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Store opening timings enna?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Fresh Idli Dosa batter and Filter coffee powder available ah?')">☕ Coffee & Batter?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Ponni Boiled Rice 25kg bag rate enna?')">🌾 Ponni Rice Rate?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Home delivery available ah Anna Nagar la?')">🚚 Home Delivery?</button>
            `;
        } else {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Dukaan khulne ka time kya hai?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Amul milk aur butter available hai?')">🥛 Milk & Butter?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Home delivery mil jayegi kya?')">🚚 Home Delivery?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('UPI / Google Pay payment chalta hai?')">💳 Google Pay / UPI?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Atta 10kg ka rate kya hai?')">🏷️ Atta Price?</button>
            `;
        }
    }

    runAutoFaqExtraction() {
        const rawText = document.getElementById('chat-export-input').value;
        if (!rawText.trim()) {
            alert("Kripya WhatsApp chat text paste karein ya file drop karein.");
            return;
        }

        const result = window.chatParser.extractFAQsFromChat(rawText);
        if (!result.success || result.faqs.length === 0) {
            alert(result.message || "Chat parse karne me koi valid FAQ nahi mila. Kripya check karein.");
            return;
        }

        this.extractedCandidateFaqs = result.faqs;
        document.getElementById('extracted-count').textContent = result.faqs.length;
        document.getElementById('extracted-faqs-section').style.display = 'block';

        const listContainer = document.getElementById('extracted-faqs-list');
        listContainer.innerHTML = result.faqs.map((item, idx) => `
            <div class="candidate-card" id="candidate-${idx}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="faq-category-tag">${item.category}</span>
                    <span class="confidence-pill"><i class="fa-solid fa-sparkles"></i> ${item.confidence}% Match</span>
                </div>
                <div style="font-weight: 700; color: #E9EDEF; font-size: 0.88rem;">
                    <span style="color: #25D366;">Q:</span> ${item.question}
                </div>
                <div style="font-size: 0.82rem; color: #AEC1CC; background: rgba(0,0,0,0.25); padding: 0.4rem 0.6rem; border-radius: 6px;">
                    <span style="color: #53BDEB; font-weight: bold;">A:</span> ${item.answer}
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem;">
                    <span style="font-size: 0.7rem; color: #8696A0;">Customer: ${item.customerName || 'WhatsApp User'}</span>
                    <button class="btn-primary" style="padding: 0.25rem 0.6rem; font-size: 0.72rem;" onclick="window.dukaanApp.importSingleCandidate(${idx})">
                        <i class="fa-solid fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `).join('');
    }

    importSingleCandidate(index) {
        const item = this.extractedCandidateFaqs[index];
        if (!item) return;

        this.currentShop.faqs.unshift({
            id: `faq-${Date.now()}`,
            category: item.category,
            question: item.question,
            questionHi: item.question,
            answer: item.answer,
            answerHi: item.answer,
            keywords: item.keywords || []
        });

        this.saveCurrentShop();
        this.renderFaqList();
        this.renderShopHeader();

        const card = document.getElementById(`candidate-${index}`);
        if (card) {
            card.style.opacity = '0.5';
            card.innerHTML = `<div style="color: #25D366; font-weight: bold; padding: 0.5rem; text-align: center;"><i class="fa-solid fa-check"></i> Added to Store FAQ Database</div>`;
        }
    }

    importAllExtractedFaqs() {
        if (!this.extractedCandidateFaqs.length) return;

        for (let item of this.extractedCandidateFaqs) {
            this.currentShop.faqs.unshift({
                id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                category: item.category,
                question: item.question,
                questionHi: item.question,
                answer: item.answer,
                answerHi: item.answer,
                keywords: item.keywords || []
            });
        }

        this.saveCurrentShop();
        this.renderFaqList();
        this.renderShopHeader();
        this.showTab('faqs', document.querySelector('.tab-btn'));
        alert(`Successfully imported ${this.extractedCandidateFaqs.length} new FAQs to your Store Knowledge Base!`);
    }

    /**
     * WhatsApp Phone Simulator Functions
     */
    resetWhatsAppChat() {
        const s = this.currentShop;
        const container = document.getElementById('wa-messages-container');
        if (!container) return;

        const welcomeHi = `नमस्ते! *${s.name}* में आपका स्वागत है। 🙏\n\nआप बोलकर (Voice Note 🎙️) या लिखकर दुकान के समय, सामान के दाम, होम डिलीवरी आदि के बारे में पूछ सकते हैं।`;
        const welcomeHinglish = `Namaste! Welcome to *${s.name}* 🙏\n\nAap bolkar (Voice Note 🎙️) ya likhkar dukaan ke timings, rates, home delivery ya stock ke bare me kuch bhi pooch sakte hain!`;

        const welcomeText = this.currentLanguage === 'hi' ? welcomeHi : welcomeHinglish;

        this.chatMessages = [
            {
                type: 'incoming',
                text: welcomeText,
                time: this.getCurrentTimeString(),
                isAi: true,
                confidence: 100
            }
        ];

        this.renderChatMessages();
    }

    getCurrentTimeString() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const mins = now.getMinutes().toString().padStart(2, '0');
        return `${hours}:${mins}`;
    }

    updateQuickChips() {
        const bar = document.getElementById('quick-chips-bar');
        if (!bar) return;

        if (this.currentShopId === 'pharmacy') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Pharmacy opening hours kya hain?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Dolo 650 aur BP machine mil jayegi?')">💊 Dolo 650 & BP Machine?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Medicine ki home delivery karte ho?')">🚚 Medicine Delivery?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Pampers baby diapers available hain?')">👶 Baby Diapers?</button>
            `;
        } else if (this.currentShopId === 'garments') {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Boutique timings aur weekly off kab hai?')">⏰ Boutique Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Designer blouse stitching facility hai?')">👗 Blouse Stitching?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Exchange ya return policy kya hai?')">🔄 Return Policy?</button>
            `;
        } else {
            bar.innerHTML = `
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Dukaan khulne ka time kya hai?')">⏰ Timings?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Amul milk aur butter available hai?')">🥛 Milk & Butter?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Home delivery mil jayegi kya?')">🚚 Home Delivery?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('UPI / Google Pay payment chalta hai?')">💳 Google Pay / UPI?</button>
                <button class="chip-btn" onclick="window.dukaanApp.sendQuickPrompt('Atta 10kg ka rate kya hai?')">🏷️ Atta Price?</button>
            `;
        }
    }

    sendQuickPrompt(text) {
        document.getElementById('wa-text-input').value = text;
        this.sendTextMessage();
    }

    sendTextMessage() {
        const input = document.getElementById('wa-text-input');
        const text = input.value.trim();
        if (!text) return;

        input.value = '';

        // Add user outgoing message
        this.chatMessages.push({
            type: 'outgoing',
            text: text,
            time: this.getCurrentTimeString(),
            isVoice: false
        });

        this.renderChatMessages();
        this.processQueryWithAi(text);
    }

    /**
     * Voice Recording Handling
     */
    toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopVoiceRecording();
        } else {
            this.startVoiceRecording();
        }
    }

    startVoiceRecording() {
        this.isRecording = true;
        this.currentVoiceTranscript = '';

        const micBtn = document.getElementById('wa-mic-btn');
        const overlay = document.getElementById('recording-overlay');
        if (micBtn) micBtn.classList.add('recording');
        if (overlay) overlay.classList.add('show');

        window.dukaanVoice.startRecording(
            this.currentLanguage,
            (transcript, isFinal) => {
                this.currentVoiceTranscript = transcript;
                if (isFinal) {
                    this.stopVoiceRecording();
                }
            },
            (recordingState) => {
                if (!recordingState) this.finalizeVoiceRecording();
            }
        );
    }

    stopVoiceRecording() {
        window.dukaanVoice.stopRecording();
        this.finalizeVoiceRecording();
    }

    finalizeVoiceRecording() {
        if (!this.isRecording) return;
        this.isRecording = false;

        const micBtn = document.getElementById('wa-mic-btn');
        const overlay = document.getElementById('recording-overlay');
        if (micBtn) micBtn.classList.remove('recording');
        if (overlay) overlay.classList.remove('show');

        const transcript = this.currentVoiceTranscript || "Amul doodh aur butter available hai kya?";

        // Add outgoing voice note bubble
        this.chatMessages.push({
            type: 'outgoing',
            text: transcript,
            time: this.getCurrentTimeString(),
            isVoice: true,
            duration: "0:04"
        });

        this.renderChatMessages();
        this.processQueryWithAi(transcript, true);
    }

    /**
     * Process query through the RAG engine
     */
    processQueryWithAi(queryText, fromVoice = false) {
        // Show typing indicator
        this.chatMessages.push({
            type: 'incoming',
            isTyping: true,
            time: this.getCurrentTimeString()
        });
        this.renderChatMessages();

        // Update stats
        const queryStat = document.getElementById('stat-total-queries');
        if (queryStat) {
            queryStat.textContent = parseInt(queryStat.textContent || '142') + 1;
        }

        setTimeout(() => {
            // Remove typing indicator
            this.chatMessages = this.chatMessages.filter(m => !m.isTyping);

            // Execute RAG Query
            const response = window.dukaanRAG.query(queryText, this.currentShop, this.currentLanguage);

            this.chatMessages.push({
                type: 'incoming',
                text: response.answer,
                time: this.getCurrentTimeString(),
                isAi: true,
                confidence: response.confidence,
                isFallback: response.isFallback,
                sourceFaq: response.sourceFaq,
                matchedKeywords: response.matchedKeywords
            });

            this.renderChatMessages();

            // Speak response aloud if request was via voice or auto-voice enabled
            if (fromVoice) {
                window.dukaanVoice.speak(response.answer, this.currentLanguage);
            }

            // Handle Fallback to Shop Owner
            if (response.isFallback) {
                this.handleFallbackAlert(queryText);
            }
        }, 800);
    }

    /**
     * Handle unanswered queries -> Add to Owner Inbox & Fallback alert
     */
    handleFallbackAlert(queryText) {
        const fallbackItem = {
            id: `fb-${Date.now()}`,
            query: queryText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            customer: "+91 98231 99012 (Customer)",
            status: 'pending'
        };

        this.fallbackQueries.unshift(fallbackItem);
        this.renderFallbackInbox();
    }

    renderFallbackInbox() {
        const countBadge = document.getElementById('fallback-count-badge');
        const statFallback = document.getElementById('stat-fallback-count');
        const container = document.getElementById('fallback-list-container');
        const placeholder = document.getElementById('no-fallback-placeholder');

        if (countBadge) countBadge.textContent = this.fallbackQueries.length;
        if (statFallback) statFallback.textContent = this.fallbackQueries.length;

        if (!container) return;

        if (this.fallbackQueries.length === 0) {
            if (placeholder) placeholder.style.display = 'block';
            return;
        }

        if (placeholder) placeholder.style.display = 'none';

        container.innerHTML = this.fallbackQueries.map((item, idx) => `
            <div class="fallback-alert-item" id="fb-item-${item.id}">
                <div>
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.2rem;">
                        <span class="faq-category-tag" style="background: rgba(239, 68, 68, 0.2); color: #EF4444;">
                            <i class="fa-solid fa-bell"></i> Owner Alert
                        </span>
                        <span style="font-size: 0.72rem; color: #8696A0;">${item.timestamp}</span>
                    </div>
                    <div class="fallback-query-text">"${item.query}"</div>
                    <div class="fallback-meta"><i class="fa-solid fa-user"></i> ${item.customer}</div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                    <a href="https://wa.me/919876543210?text=${encodeURIComponent('Namaste! Aapne pucha tha: ' + item.query)}" target="_blank" class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; text-decoration: none;">
                        <i class="fa-brands fa-whatsapp"></i> Reply on WhatsApp
                    </a>
                    <button class="btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="window.dukaanApp.convertFallbackToFaq('${item.id}')">
                        <i class="fa-solid fa-plus"></i> Add as FAQ
                    </button>
                </div>
            </div>
        `).join('');
    }

    convertFallbackToFaq(fallbackId) {
        const item = this.fallbackQueries.find(f => f.id === fallbackId);
        if (!item) return;

        this.openAddFaqModal();
        document.getElementById('modal-faq-question').value = item.query;
        document.getElementById('modal-faq-question-hi').value = item.query;

        // Remove from inbox after resolving
        this.fallbackQueries = this.fallbackQueries.filter(f => f.id !== fallbackId);
        this.renderFallbackInbox();
    }

    /**
     * Render Chat Message Bubbles in the WhatsApp Smartphone Frame
     */
    renderChatMessages() {
        const container = document.getElementById('wa-messages-container');
        if (!container) return;

        container.innerHTML = this.chatMessages.map((msg, index) => {
            if (msg.isTyping) {
                return `
                    <div class="wa-bubble incoming" style="display: flex; gap: 4px; align-items: center; padding: 0.6rem 0.9rem;">
                        <span style="font-size: 0.75rem; color: #8696A0; font-style: italic;">DukaanDost is typing...</span>
                    </div>
                `;
            }

            if (msg.isVoice) {
                return `
                    <div class="wa-bubble outgoing">
                        <div class="voice-bubble-content">
                            <button class="voice-play-btn" onclick="window.dukaanVoice.speak('${msg.text.replace(/'/g, "\\'")}', '${this.currentLanguage}')">
                                <i class="fa-solid fa-play"></i>
                            </button>
                            <div class="voice-waveform-wrap">
                                <div class="voice-bars">
                                    <div class="vbar active" style="height: 14px;"></div>
                                    <div class="vbar active" style="height: 8px;"></div>
                                    <div class="vbar active" style="height: 18px;"></div>
                                    <div class="vbar active" style="height: 12px;"></div>
                                    <div class="vbar" style="height: 20px;"></div>
                                    <div class="vbar" style="height: 10px;"></div>
                                    <div class="vbar" style="height: 16px;"></div>
                                    <div class="vbar" style="height: 6px;"></div>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-size: 0.65rem; color: #667781;">
                                    <span>Voice Note (${msg.duration || '0:04'})</span>
                                </div>
                            </div>
                        </div>
                        <div class="voice-bubble-transcription">
                            <i class="fa-solid fa-closed-captioning"></i> "${msg.text}"
                        </div>
                        <div class="bubble-meta">
                            <span>${msg.time}</span>
                            <span class="blue-ticks">✓✓</span>
                        </div>
                    </div>
                `;
            }

            const formattedText = msg.text.replace(/\*(.*?)\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

            if (msg.type === 'outgoing') {
                return `
                    <div class="wa-bubble outgoing">
                        <div>${formattedText}</div>
                        <div class="bubble-meta">
                            <span>${msg.time}</span>
                            <span class="blue-ticks">✓✓</span>
                        </div>
                    </div>
                `;
            } else {
                // Incoming Bot Reply
                return `
                    <div class="wa-bubble incoming">
                        ${msg.isAi ? `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                <span class="ai-attribution-tag">
                                    <i class="fa-solid fa-robot"></i> DukaanDost AI
                                </span>
                                <span class="confidence-pill" title="RAG Confidence Score">
                                    ${msg.confidence}% Match
                                </span>
                            </div>
                        ` : ''}
                        <div>${formattedText}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem;">
                            <button class="btn-icon" style="padding: 0.1rem 0.3rem; font-size: 0.75rem; color: #075E54;" title="Listen to Voice" onclick="window.dukaanVoice.speak('${msg.text.replace(/'/g, "\\'")}', '${this.currentLanguage}')">
                                <i class="fa-solid fa-volume-high"></i> Listen
                            </button>
                            <div class="bubble-meta">
                                <span>${msg.time}</span>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    simulateVoiceCall() {
        alert(`📞 Simulating Incoming Voice Call on +91 98765 43210...\nDukaanDost Voice Agent connected! Speak in Hindi or Hinglish.`);
        this.startVoiceRecording();
    }
}

// Instantiate on load
window.addEventListener('DOMContentLoaded', () => {
    window.dukaanApp = new DukaanApp();
});
