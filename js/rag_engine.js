/**
 * DukaanDost RAG Engine
 * Lightweight client-side semantic matching, Indic language normalization,
 * intent scoring, and confidence-gated answer generation with shop owner fallback.
 */

class DukaanRAGEngine {
    constructor() {
        // Intent dictionary for vernacular Hinglish and Hindi terms
        this.synonyms = {
            timings: ["timing", "timings", "time", "samay", "khuli", "khulti", "open", "close", "band", "subah", "shaam", "raat", "hours", "sunday", "kab tak", "कब", "समय", "खुली", "बंद"],
            delivery: ["delivery", "deliver", "ghar", "bhejo", "home delivery", "charge", "charges", "kitne der", "minimum", "free delivery", "डिलीवरी", "घर", "पहुंचाना"],
            payment: ["pay", "payment", "upi", "google pay", "gpay", "phonepe", "paytm", "cash", "cod", "online", "qr", "qr code", "bhim", "भुगतान", "पैसे", "ऑनलाइन"],
            pricing: ["price", "rate", "cost", "daam", "kitne ka", "bhaav", "paisa", "rupaye", "₹", "rs", "भाव", "कीमत", "रेट", "दाम"],
            location: ["location", "address", "pata", "kahan", "kaha", "where", "near", "landmark", "rasta", "रास्ता", "पता", "कहाँ"],
            stock: ["stock", "available", "milega", "hoga", "hai kya", "pack", "item", "bache", "mil jayega", "मिलेगा", "स्टॉक", "उपलब्ध"]
        };

        // Stop words in English and Hindi/Hinglish to filter out noise
        this.stopWords = new Set([
            "a", "an", "the", "is", "are", "am", "in", "at", "to", "for", "of", "and", "or", "kya", "hai",
            "hain", "ka", "ki", "ke", "ko", "se", "mein", "par", "bhi", "ji", "bhaiya", "sir", "namaste",
            "kripya", "please", "batao", "bataiye", "kijiye", "kya", "kuch", "kisi", "yeh", "woh", "होता", "है", "का", "की", "के", "में"
        ]);
    }

    /**
     * Clean and tokenize query string
     */
    tokenize(text) {
        if (!text) return [];
        return text
            .toLowerCase()
            .replace(/[^\w\s\u0900-\u097F₹]/gi, " ")
            .split(/\s+/)
            .filter(token => token.length > 1 && !this.stopWords.has(token));
    }

    /**
     * Normalize Indic tokens to standard stems
     */
    normalizeToken(token) {
        const t = token.toLowerCase();
        // Common Hinglish stems
        if (t.startsWith("khul")) return "open";
        if (t.startsWith("band")) return "close";
        if (t.startsWith("deliv")) return "delivery";
        if (t.startsWith("tim")) return "timing";
        if (t.startsWith("pay")) return "payment";
        if (t.startsWith("paisa") || t.startsWith("daam") || t.startsWith("rate") || t.startsWith("bhav")) return "price";
        if (t.startsWith("pata") || t.startsWith("kahan") || t.startsWith("kaha")) return "location";
        if (t.startsWith("doodh") || t.startsWith("milk")) return "milk";
        if (t.startsWith("atta") || t.startsWith("aata")) return "atta";
        if (t.startsWith("tel") || t.startsWith("oil")) return "oil";
        return t;
    }

    /**
     * Compute Cosine / Jaccard Semantic Relevance between query and FAQ item
     */
    scoreFAQ(queryTokens, faq, shop) {
        if (!queryTokens.length) return { score: 0, matchedKeywords: [] };

        const matchedKeywords = [];
        let score = 0;

        // Combine FAQ tokens from question, Hindi question, keywords, category, and answer
        const faqText = `${faq.question} ${faq.questionHi || ''} ${(faq.keywords || []).join(' ')} ${faq.category || ''} ${faq.answer} ${faq.answerHi || ''}`;
        const faqTokens = this.tokenize(faqText).map(t => this.normalizeToken(t));
        const faqTokenSet = new Set(faqTokens);

        // 1. Direct Keyword / Token Overlap
        queryTokens.forEach(rawToken => {
            const normToken = this.normalizeToken(rawToken);
            
            // Exact token match in FAQ
            if (faqTokenSet.has(normToken) || faqTokenSet.has(rawToken)) {
                score += 25;
                matchedKeywords.push(rawToken);
                return;
            }

            // Substring or prefix match
            for (let fToken of faqTokens) {
                if (fToken.includes(normToken) || normToken.includes(fToken)) {
                    score += 15;
                    matchedKeywords.push(rawToken);
                    break;
                }
            }

            // Keyword array direct match (highest weight)
            if (faq.keywords && Array.isArray(faq.keywords)) {
                for (let kw of faq.keywords) {
                    if (kw.toLowerCase().includes(rawToken) || rawToken.includes(kw.toLowerCase())) {
                        score += 30;
                        if (!matchedKeywords.includes(rawToken)) matchedKeywords.push(rawToken);
                        break;
                    }
                }
            }
        });

        // 2. Intent Category Match
        for (let [category, words] of Object.entries(this.synonyms)) {
            const queryMatchesIntent = queryTokens.some(t => words.includes(t) || words.includes(this.normalizeToken(t)));
            if (queryMatchesIntent) {
                if (faq.category === category || faqText.toLowerCase().includes(category)) {
                    score += 25;
                    matchedKeywords.push(`[Intent:${category}]`);
                }
            }
        }

        // 3. Normalize score into 0 - 100 percentage
        const maxExpectedTokens = Math.max(queryTokens.length, 2);
        const normalizedScore = Math.min(100, Math.round((score / (maxExpectedTokens * 35)) * 100));

        return { score: normalizedScore, matchedKeywords: [...new Set(matchedKeywords)] };
    }

    /**
     * Query the RAG knowledge base for a specific shop
     */
    query(userQuery, shop, preferredLanguage = "hinglish") {
        if (!userQuery || !userQuery.trim()) {
            return {
                matched: false,
                confidence: 0,
                answer: "Kripya apna sawal puchein (Please ask a question).",
                answerHi: "कृपया अपना सवाल पूछें।",
                sourceFaq: null,
                isFallback: true
            };
        }

        const queryTokens = this.tokenize(userQuery);
        let bestMatch = null;
        let highestScore = -1;
        let bestKeywords = [];

        // Evaluate all FAQs in shop's knowledge base
        const faqs = shop.faqs || [];
        for (let faq of faqs) {
            const result = this.scoreFAQ(queryTokens, faq, shop);
            if (result.score > highestScore) {
                highestScore = result.score;
                bestMatch = faq;
                bestKeywords = result.matchedKeywords;
            }
        }

        const CONFIDENCE_THRESHOLD = 45; // Low threshold triggers shopkeeper fallback

        if (bestMatch && highestScore >= CONFIDENCE_THRESHOLD) {
            // High confidence answer
            const isHindi = preferredLanguage === "hi";
            let answerText = isHindi && bestMatch.answerHi ? bestMatch.answerHi : bestMatch.answer;

            return {
                matched: true,
                confidence: highestScore,
                answer: answerText,
                answerHi: bestMatch.answerHi || bestMatch.answer,
                sourceFaq: bestMatch,
                matchedKeywords: bestKeywords,
                isFallback: false
            };
        } else {
            // Low confidence -> Trigger Owner Fallback
            const isHindi = preferredLanguage === "hi";
            const fallbackMsgHinglish = `Maaf kijiye, mujhe iski pakki jankari nahi hai. 🙏\nMaine aapka ye sawal dukaandar (${shop.owner || shop.name}) ji ko WhatsApp par forward kar diya hai. Wo jaldi hi reply karenge!`;
            const fallbackMsgHindi = `माफ़ कीजिए, मुझे इसकी पूरी जानकारी नहीं है। 🙏\nमैंने आपका यह सवाल दुकानदार (${shop.owner || shop.name}) जी को भेज दिया है। वे शीघ्र ही उत्तर देंगे!`;

            return {
                matched: false,
                confidence: Math.max(0, highestScore),
                answer: isHindi ? fallbackMsgHindi : fallbackMsgHinglish,
                answerHi: fallbackMsgHindi,
                sourceFaq: null,
                isFallback: true,
                fallbackQuery: userQuery,
                shopContact: shop.phone
            };
        }
    }
}

// Global instance
window.dukaanRAG = new DukaanRAGEngine();
