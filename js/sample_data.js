// Preloaded realistic Indian shop profiles with multilingual FAQ databases
const SAMPLE_SHOPS = {
    "kirana": {
        id: "kirana",
        name: "Sharma Kirana & General Store",
        tagline: "Aapki Apni Pados Ki Dukaan 🛒",
        owner: "Ramesh Sharma",
        phone: "+91 98765 43210",
        address: "Shop 14, Main Market, Sector 4, Noida, UP",
        category: "Grocery & Daily Needs",
        primaryLanguage: "hi",
        timings: "Mon-Sat: 7:30 AM - 10:30 PM | Sun: 8:00 AM - 10:00 PM",
        deliveryMinOrder: "₹300",
        deliveryRadius: "3 km",
        deliveryTime: "30-45 mins",
        upiId: "sharmastore@okhdfcbank",
        avatar: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-k1",
                category: "timings",
                question: "Dukaan khulne aur band hone ka time kya hai? (Store Timings)",
                questionHi: "दुकान कब खुलती और बंद होती है?",
                keywords: ["timing", "timings", "time", "khuli", "open", "close", "band", "subah", "raat", "hours", "samay"],
                answer: "Hamari dukaan subah 7:30 AM se raat 10:30 PM tak khuli rehti hai. Sunday ko 8:00 AM se 10:00 PM tak open rehti hai.",
                answerHi: "हमारी दुकान सुबह 7:30 बजे से रात 10:30 बजे तक खुली रहती है। रविवार को सुबह 8:00 से रात 10:00 तक खुली रहती है।"
            },
            {
                id: "faq-k2",
                category: "delivery",
                question: "Kya home delivery available hai aur charge kitna hai? (Home Delivery)",
                questionHi: "क्या होम डिलीवरी होती है और कितना चार्ज है?",
                keywords: ["delivery", "home delivery", "deliver", "ghar", "bhejo", "charges", "free", "order"],
                answer: "Haan ji! 3 km ke radius mein ₹300 se upar ke order par FREE home delivery hai. ₹300 se kam order par ₹20 delivery charge hai. Delivery 30-45 mins mein ho jaati hai.",
                answerHi: "हाँ जी! 3 किमी के दायरे में ₹300 से ऊपर के ऑर्डर पर फ्री होम डिलीवरी है। 30 से 45 मिनट में डिलीवरी मिल जाती है।"
            },
            {
                id: "faq-k3",
                category: "payment",
                question: "Payment kaise kar sakte hain? UPI / Cash? (Payment Methods)",
                questionHi: "पेमेंट कैसे कर सकते हैं? ऑनलाइन या कैश?",
                keywords: ["payment", "pay", "upi", "google pay", "gpay", "phonepe", "paytm", "cash", "cod", "online", "qr"],
                answer: "Aap sabhi tarike se pay kar sakte hain: Google Pay, PhonePe, Paytm, QR Code scan aur Cash on Delivery (COD). Hamari UPI ID: sharmastore@okhdfcbank",
                answerHi: "आप Google Pay, PhonePe, Paytm, QR कोड और कैश (COD) से भुगतान कर सकते हैं। हमारी UPI ID: sharmastore@okhdfcbank"
            },
            {
                id: "faq-k4",
                category: "stock",
                question: "Amul milk, butter aur dahi available hai kya? (Dairy Products)",
                questionHi: "अमूल दूध, मक्खन और दही मिलेगा क्या?",
                keywords: ["milk", "doodh", "amul", "butter", "makhan", "dahi", "curd", "paneer", "taaza", "gold", "dairy"],
                answer: "Haan ji, Amul Taaza, Amul Gold, Amul Butter (100g & 500g) aur taaza Paneer hamesha fresh stock mein available rehta hai.",
                answerHi: "हाँ जी, अमूल ताजा, अमूल गोल्ड, अमूल बटर और फ्रेश पनीर हमेशा स्टॉक में उपलब्ध है।"
            },
            {
                id: "faq-k5",
                category: "pricing",
                question: "Aashirvaad Atta 10kg aur Fortune Oil ka rate kya hai? (Atta & Oil Price)",
                questionHi: "आशीर्वाद आटा और फॉर्च्यून तेल का क्या भाव है?",
                keywords: ["atta", "aashirvaad", "oil", "tel", "fortune", "mustard", "sarson", "rate", "price", "daam", "kitne ka"],
                answer: "Aashirvaad Shudh Chakki Atta 10kg ₹410 ka hai. Fortune Kachi Ghani Mustard Oil 1L pouch ₹142 ka hai.",
                answerHi: "आशीर्वाद आटा 10 किलो ₹410 का है और फॉर्च्यून सरसों का तेल 1 लीटर ₹142 का है।"
            }
        ]
    },
    "pharmacy": {
        id: "pharmacy",
        name: "Gupta Medicos & Healthcare",
        tagline: "24/7 Helpline & Genuine Medicines 💊",
        owner: "Dr. Alok Gupta",
        phone: "+91 94150 11223",
        address: "Plot 88, Civil Lines, Lucknow, UP",
        category: "Pharmacy & Medical",
        primaryLanguage: "hi",
        timings: "Open Everyday: 8:00 AM - 11:30 PM (Night Emergency on call)",
        deliveryMinOrder: "₹200",
        deliveryRadius: "5 km",
        deliveryTime: "30 mins",
        upiId: "guptamedicos@icici",
        avatar: "https://images.unsplash.com/photo-1586015555751-63c295719a9f?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-p1",
                category: "timings",
                question: "Pharmacy ke opening hours kya hain? (Store Timings)",
                questionHi: "दवा की दुकान कब तक खुली रहती है?",
                keywords: ["timing", "hours", "open", "close", "emergency", "raat", "night", "kab tak"],
                answer: "Hum roz subah 8:00 AM se raat 11:30 PM tak open rehte hain. Emergency medicine ke liye 9415011223 par call karein.",
                answerHi: "हम रोज़ाना सुबह 8:00 बजे से रात 11:30 बजे तक खुले रहते हैं।"
            },
            {
                id: "faq-p2",
                category: "delivery",
                question: "Kya prescription medicine ki home delivery hoti hai? (Medicine Delivery)",
                questionHi: "क्या दवाइयों की होम डिलीवरी हो सकती है?",
                keywords: ["delivery", "home delivery", "prescription", "parcha", "photo", "ghar par"],
                answer: "Haan ji! WhatsApp par prescription ki photo bhej dijiye. ₹200 se upar 30-45 mins mein delivery mil jayegi.",
                answerHi: "हाँ जी! आप पर्चे की फोटो व्हाट्सएप पर भेज दें। 30-45 मिनट में डिलीवरी मिल जाएगी।"
            },
            {
                id: "faq-p3",
                category: "stock",
                question: "Dolo 650, BP machine aur Sugar test strips available hain?",
                questionHi: "डोलो 650, बीपी मशीन और शुगर स्ट्रिप मिल जाएगी?",
                keywords: ["dolo", "paracetamol", "bp", "sugar", "strip", "omron"],
                answer: "Haan ji, Dolo 650, Omron Digital BP Monitor (₹1,850) aur Accu-Chek test strips (₹980) available hain.",
                answerHi: "हाँ जी, डोलो 650, बीपी मशीन और शुगर टेस्ट स्ट्रिप्स उपलब्ध हैं।"
            }
        ]
    },
    "garments": {
        id: "garments",
        name: "Radhika Ethnic & Boutique",
        tagline: "Latest Sarees, Kurtis & Custom Stitching 👗",
        owner: "Radhika Agarwal",
        phone: "+91 98200 55443",
        address: "Shop 5, Fashion Street, Commercial Road, Jaipur",
        category: "Clothing & Boutique",
        primaryLanguage: "hi",
        timings: "10:30 AM - 9:00 PM (Tuesday Closed)",
        deliveryMinOrder: "₹500",
        deliveryRadius: "All India via Courier",
        deliveryTime: "2-4 days",
        upiId: "radhikaboutique@axisbank",
        avatar: "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-g1",
                category: "timings",
                question: "Boutique timings aur weekly off kab hota hai?",
                questionHi: "दुकान का समय और छुट्टी का दिन क्या है?",
                keywords: ["timing", "open", "close", "chutti", "tuesday", "off"],
                answer: "Boutique subah 10:30 AM se raat 9:00 PM tak open rehta hai. Mangalwar (Tuesday) ko band rehta hai.",
                answerHi: "बुटीक सुबह 10:30 से रात 9:00 बजे तक खुलता है। मंगलवार को अवकाश रहता है।"
            },
            {
                id: "faq-g2",
                category: "services",
                question: "Kya stitching aur alterations ki facility hai?",
                questionHi: "क्या सिलाई और ऑल्टरेशन की सुविधा है?",
                keywords: ["stitching", "silai", "tailor", "alter", "fitting", "blouse"],
                answer: "Haan ji! Designer blouse stitching (₹450-₹750), suit fitting (₹100-₹150) aur fall-pico 24-48 hours mein available hai.",
                answerHi: "हाँ जी! डिजाइनर ब्लाउज सिलाई और सूट फिटिंग की सुविधा उपलब्ध है।"
            }
        ]
    },
    "hardware": {
        id: "hardware",
        name: "Verma Hardware & Electricals",
        tagline: "Pipes, Wires, Paints & Plumber Services 🔧",
        owner: "Rajesh Verma",
        phone: "+91 97110 88990",
        address: "Station Road, Near Bus Stand, Meerut, UP",
        category: "Hardware & Electricals",
        primaryLanguage: "hi",
        timings: "8:30 AM - 9:00 PM (Open 7 Days)",
        deliveryMinOrder: "₹500",
        deliveryRadius: "8 km (Tempo / Delivery available)",
        deliveryTime: "1-2 hours",
        upiId: "vermahardware@icici",
        avatar: "https://images.unsplash.com/photo-1581783898377-1c85bf937427?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-h1",
                category: "pricing",
                question: "Philips 9W LED bulb aur Havells 2.5mm wire coil ka kya rate hai?",
                keywords: ["bulb", "philips", "havells", "wire", "coil", "led", "rate", "price"],
                answer: "Philips 9W LED bulb ₹85 per piece hai aur Havells 2.5 sq mm 90m copper coil ₹2,850 ka hai.",
                answerHi: "फिलिप्स 9W एलईडी बल्ब ₹85 का है और हैवेल्स 2.5 एमएम 90 मीटर वायर ₹2,850 का है।"
            },
            {
                id: "faq-h2",
                category: "services",
                question: "Ghar par tap leakage aur electrician visit karte hain kya?",
                keywords: ["plumber", "electrician", "leakage", "visit", "tap", "fitting"],
                answer: "Haan ji! Verified plumber aur electrician home visit available hai. Visiting charge ₹150 hai, 1 hour mein visit ho jayegi.",
                answerHi: "हाँ जी! प्लम्बर और इलेक्ट्रीशियन होम विजिट की सुविधा है। विजिटिंग चार्ज ₹150 है।"
            }
        ]
    },
    "bakery": {
        id: "bakery",
        name: "Agarwal Bikaner Sweets & Bakery",
        tagline: "Pure Desi Ghee Mithai & 100% Eggless Cakes 🎂",
        owner: "Sunil Agarwal",
        phone: "+91 93100 44221",
        address: "Opposite Town Hall, Civil Lines, Kanpur, UP",
        category: "Bakery & Sweets",
        primaryLanguage: "hi",
        timings: "7:00 AM - 10:30 PM (Daily Fresh Breakfast from 7:30 AM)",
        deliveryMinOrder: "₹300",
        deliveryRadius: "5 km",
        deliveryTime: "30-40 mins",
        upiId: "agarwalsweets@paytm",
        avatar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-b1",
                category: "pricing",
                question: "Kaju Katli aur customized Chocolate Cake ka rate kya hai?",
                keywords: ["kaju katli", "mithai", "cake", "chocolate", "rate", "price", "eggless"],
                answer: "Pure Desi Ghee Kaju Katli ₹880/kg hai. 100% Eggless Chocolate Truffle cake 1kg ₹650 ka hai jo 3-4 hours mein ready ho jata hai.",
                answerHi: "काजू कतली ₹880 प्रति किलो है और 1 किलो एगलेस चॉकलेट केक ₹650 का है।"
            },
            {
                id: "faq-b2",
                category: "stock",
                question: "Garam Samosa aur Dhokla ka bulk order mil sakta hai?",
                keywords: ["samosa", "dhokla", "bulk", "party", "garam", "nashta"],
                answer: "Haan ji! Samosa ₹15 per piece aur Dhokla ₹240/kg hai. 2 ghante pehle confirm karne par garam fresh delivery mil jati hai.",
                answerHi: "हाँ जी! समोसा ₹15 और ढोकला ₹240/किलो में पार्टी और बल्क आर्डर पर उपलब्ध है।"
            }
        ]
    },
    "mobile_repair": {
        id: "mobile_repair",
        name: "Star Telecom & Mobile Care",
        tagline: "Instant Screen Replacement & Fast Phone Repairs 📱",
        owner: "Imran Khan",
        phone: "+91 98970 33211",
        address: "Shop 12, Nehru Market, Aligarh, UP",
        category: "Electronics & Mobile Repair",
        primaryLanguage: "hi",
        timings: "10:00 AM - 9:30 PM (Open 7 Days)",
        deliveryMinOrder: "Free Pickup & Drop for Repairs",
        deliveryRadius: "Citywide",
        deliveryTime: "45 mins on-site repair",
        upiId: "startelecom@axisbank",
        avatar: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-m1",
                category: "services",
                question: "Phone display replacement aur UV glass lagwane ka kya charge hai?",
                keywords: ["display", "screen", "uv glass", "tempered", "touch", "repair"],
                answer: "Original display with 3-months warranty ₹2,200 (first-copy ₹1,400) mein 45 minutes mein fit ho jata hai. Curved UV glass ₹180 mein lagta hai.",
                answerHi: "ओरिजिनल डिस्प्ले ₹2,200 में 3 महीने की वारंटी के साथ हाथो-हाथ बदला जाता है।"
            },
            {
                id: "faq-m2",
                category: "stock",
                question: "iPhone original fast charger aur second-hand phones milte hain?",
                keywords: ["iphone", "charger", "second hand", "used phone", "apple"],
                answer: "Apple original 20W charger ₹1,700 ka hai with 1 year Apple bill warranty. Verified second-hand phones 6 months warranty ke sath available hain.",
                answerHi: "एप्पल 20W चार्जर और 6 महीने की वारंटी वाले पुराने स्मार्टफोन उपलब्ध हैं।"
            }
        ]
    },
    "stationery": {
        id: "stationery",
        name: "Student Corner Stationery & Xerox",
        tagline: "Urgent Xerox, Spiral Binding & NCERT Books 📚",
        owner: "Ravi Verma",
        phone: "+91 94520 66778",
        address: "Opposite DAV College Gate, Dehradun, UK",
        category: "Stationery & Xerox",
        primaryLanguage: "hi",
        timings: "8:00 AM - 10:00 PM (Daily)",
        deliveryMinOrder: "WhatsApp PDF Printout Service",
        deliveryRadius: "Campus & 2 km",
        deliveryTime: "15 mins",
        upiId: "studentcorner@paytm",
        avatar: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-s1",
                category: "pricing",
                question: "Printout aur Spiral binding ka rate kya hai? WhatsApp par file bhej sakte hain?",
                keywords: ["printout", "xerox", "spiral", "binding", "pdf", "whatsapp", "rate"],
                answer: "Haan, WhatsApp par PDF bhej dijiye. B&W print ₹2/page (both side ₹3), colour ₹10/page. Soft Spiral ₹35 aur Hardcover thesis binding ₹220 hai.",
                answerHi: "हाँ! ब्लैक एंड व्हाइट प्रिंटआउट ₹2 और स्पाइरल बाइंडिंग ₹35 में तुरंत हो जाती है।"
            },
            {
                id: "faq-s2",
                category: "stock",
                question: "NCERT school books aur passport photo banti hai kya?",
                keywords: ["ncert", "books", "passport photo", "urgent", "lamination"],
                answer: "Class 6-12 NCERT books available hain. 8 copies passport size photo ₹50 mein 10 minute mein glossy paper par ready mil jati hai.",
                answerHi: "एनसीईआरटी किताबें और 8 पासपोर्ट साइज फोटो ₹50 में 10 मिनट में उपलब्ध हैं।"
            }
        ]
    },
    "south_indian": {
        id: "south_indian",
        name: "Murugan Stores & Provisions",
        tagline: "Authentic Degree Coffee Powder & Fresh Batter 🥥",
        owner: "Murugan Swamy",
        phone: "+91 94440 12345",
        address: "12, 4th Main Road, Anna Nagar, Chennai, TN",
        category: "South Indian Grocery & Provisions",
        primaryLanguage: "en",
        timings: "7:00 AM - 10:00 PM (Everyday)",
        deliveryMinOrder: "₹400",
        deliveryRadius: "3 km",
        deliveryTime: "30-45 mins",
        upiId: "muruganstore@ybl",
        avatar: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150&auto=format&fit=crop&q=80",
        faqs: [
            {
                id: "faq-mu1",
                category: "stock",
                question: "Fresh Idli/Dosa batter and Kumbakonam filter coffee powder available ah?",
                keywords: ["idli", "dosa", "batter", "coffee", "powder", "kumbakonam", "filter coffee"],
                answer: "Yes! Fresh Asal Idli/Dosa batter 1kg pouch ₹45 and fresh ground Kumbakonam Degree Filter Coffee Powder 500g ₹290 available.",
                answerHi: "हाँ, फ्रेश इडली/डोसा बैटर ₹45 और फिल्टर कॉफी पाउडर ₹290 में उपलब्ध है।"
            },
            {
                id: "faq-mu2",
                category: "pricing",
                question: "What is the price of 25kg Deluxe Ponni Boiled rice and Idhayam Gingelly oil?",
                keywords: ["rice", "ponni", "gingelly oil", "idhayam", "rate", "price"],
                answer: "Deluxe Ponni Boiled Rice 25kg bag is ₹1,480. Idhayam Gingelly Oil 1 Litre pouch is ₹265.",
                answerHi: "पोन्नी चावल 25 किलो बैग ₹1,480 और तिल का तेल 1 लीटर ₹265 का है।"
            }
        ]
    }
};

// Rich collection of realistic WhatsApp Chat export texts across diverse Indian small business sectors
const SAMPLE_CHAT_LOGS = {
    "kirana": `[12/03/26, 09:14:22] Ramesh Kumar: Namaste Sharma ji, dukaan khul gayi kya?
[12/03/26, 09:15:05] Sharma General Store: Namaste Ramesh bhai! Haan dukaan subah 7:30 baje se raat 10:30 baje tak khuli rehti hai.
[12/03/26, 09:16:10] Ramesh Kumar: Sunday ko bhi open rehti hai kya?
[12/03/26, 09:16:45] Sharma General Store: Haan bhai, Sunday ko bhi dukaan poora din khulti hai, 8:00 AM se 10:00 PM.
[12/03/26, 11:30:15] Priya Verma: Bhaiya Amul Taaza milk packet available hai kya?
[12/03/26, 11:31:02] Sharma General Store: Haan bhenji, Amul Taaza aur Amul Gold dono fresh stock mein available hain.
[12/03/26, 11:32:40] Priya Verma: Amul Butter 500g ka rate kya hai?
[12/03/26, 11:33:12] Sharma General Store: Amul Butter 500g ₹275 ka hai aur 100g packet ₹58 ka hai.
[12/03/26, 14:20:00] Amit Singh: Bhaiya home delivery mil sakti hai Sector 4 mein?
[12/03/26, 14:21:18] Sharma General Store: Haan bilkul, 2 km ke radius mein free home delivery hai ₹300 se upar ke order par. ₹300 se kam par ₹20 delivery charge lagta hai.
[12/03/26, 14:22:45] Amit Singh: Delivery kitne time mein aa jayegi?
[12/03/26, 14:23:30] Sharma General Store: Order confirm hone ke 30 se 45 minutes mein delivery ho jaati hai.
[12/03/26, 16:05:10] Sunita Devi: Online payment le lete ho? Google Pay ya PhonePe?
[12/03/26, 16:05:55] Sharma General Store: Haan ji, Google Pay, PhonePe, Paytm, QR code scan aur Cash on Delivery (COD) sab chalta hai. UPI ID: sharmastore@upi
[12/03/26, 17:15:20] Vikas Gupta: Bhaiya Fortune Mustard Oil 1 Litre pouch kitne ka hai?
[12/03/26, 17:16:05] Sharma General Store: Fortune Kachi Ghani Mustard Oil 1L pouch ₹142 ka hai.
[12/03/26, 17:17:11] Vikas Gupta: Aashirvaad Shudh Chakki Atta 10kg ka kya rate hai?
[12/03/26, 17:18:00] Sharma General Store: Aashirvaad Atta 10kg ₹410 ka hai aur 5kg pouch ₹215 ka hai.
[12/03/26, 19:40:12] Rohit Mehra: Aapki dukaan ka exact location kahan pe hai?
[12/03/26, 19:41:00] Sharma General Store: Hamari dukaan Shop No. 14, Main Market, Near SBI ATM, Sector 4, Noida mein hai.`,

    "pharmacy": `15/03/2026, 08:30 - Dr. Rajesh: Gupta ji, Dolo 650mg strip available hai?
15/03/2026, 08:31 - Gupta Medicos & Healthcare: Haan Doctor sahab, Dolo 650, Calpol 650 aur Paracetamol tablets available hain.
15/03/2026, 09:12 - Ananya Sen: Bhaiya pharmacy kab tak open rehti hai emergency ke liye?
15/03/2026, 09:13 - Gupta Medicos & Healthcare: Namaste! Hum subah 8:00 AM se raat 11:30 PM tak open rehte hain. Emergency medicine ke liye 24/7 helpline: 9415011223.
15/03/2026, 11:45 - Manoj Tiwari: Kya BP machine aur Sugar checking strip milti hai?
15/03/2026, 11:46 - Gupta Medicos & Healthcare: Haan ji, Omron Digital BP Monitor ₹1,850 aur Accu-Chek Active 50 test strips ₹980 mein available hain.
15/03/2026, 14:02 - Kavita Singh: Medicine ki home delivery karte ho kya? Prescription WhatsApp par bhej du?
15/03/2026, 14:03 - Gupta Medicos & Healthcare: Haan ji, prescription ki photo WhatsApp par bhej dijiye. 3 km ke andar 45 minutes mein free home delivery mil jayegi minimum ₹200 order par.
15/03/2026, 16:30 - Suresh Verma: Baby diapers aur Cerelac available hai?
15/03/2026, 16:31 - Gupta Medicos & Healthcare: Haan Suresh ji, Pampers, MamyPoko Pants (all sizes) aur Nestle Cerelac (Rice/Wheat/Apple) fresh stock mein hai.
15/03/2026, 18:20 - Pooja Roy: Credit card ya UPI accept karte ho?
15/03/2026, 18:21 - Gupta Medicos & Healthcare: Haan, Credit/Debit cards, Google Pay, PhonePe, Paytm aur Cash sabhi payment methods accept hote hain.`,

    "hardware": `[18/03/26, 09:10:14] Rajesh Verma: Namaste Verma Hardware, dukaan khul gayi hai kya?
[18/03/26, 09:11:02] Verma Hardware & Electricals: Namaste Rajesh ji! Haan dukaan subah 8:30 AM se raat 9:00 PM tak open rehti hai.
[18/03/26, 09:12:35] Rajesh Verma: Philips 9W LED bulb aur Havells 2.5 sq mm wire bundle ka rate kya hai?
[18/03/26, 09:13:40] Verma Hardware & Electricals: Philips 9W LED bulb ₹85 per piece hai aur Havells 2.5 sq mm 90-meter coil ₹2,850 ka hai (100% pure copper).
[18/03/26, 11:20:10] Sunil Thekedar: Bhaiya Asian Paints Apex Ultima White 20 Litre bucket available hai?
[18/03/26, 11:21:05] Verma Hardware & Electricals: Haan Sunil ji, Apex Ultima 20L bucket ₹5,200 mein available hai. Primer aur Wall Putty bhi stock mein hai.
[18/03/26, 13:45:22] Anita Joshi: Bathroom tap leakage ho raha hai. Kya plumber visit karta hai ghar par?
[18/03/26, 13:46:15] Verma Hardware & Electricals: Haan madam, hamare paas verified electrician aur plumber service available hai. Visiting charge ₹150 hai, 1 hour mein visit ho jayegi.
[18/03/26, 15:30:40] Mohan Kumar: Site par 10 bag UltraTech cement delivery karwa doge kya?
[18/03/26, 15:31:20] Verma Hardware & Electricals: Haan Mohan ji, UltraTech Super ₹385 per bag hai. 10 bags par free transport delivery 2 ghante mein ho jayegi.
[18/03/26, 17:10:05] Deepak Sharma: Payment UPI ya cheque se ho jayegi?
[18/03/26, 17:11:00] Verma Hardware & Electricals: Haan Google Pay, PhonePe, NEFT/RTGS aur Cash sab accept hota hai. UPI ID: vermahardware@icici.
[18/03/26, 19:00:15] Amit Bansal: Jaquar ke bathroom fittings aur shower mil jayenge?
[18/03/26, 19:01:10] Verma Hardware & Electricals: Haan ji, Jaquar aur Cera dono ke sanitaryware, taps aur overhead showers with company warranty available hain.`,

    "bakery": `20/03/2026, 09:30 - Preeti Saxena: Namaste Agarwal Sweets, Kaju Katli ka fresh rate kya hai?
20/03/2026, 09:31 - Agarwal Bikaner Sweets & Bakery: Namaste Preeti ji! Kaju Katli fresh pure desi ghee ₹880 per kg hai. 500g box ₹450 ka hai.
20/03/2026, 10:15 - Rahul Malhotra: 1 kg Chocolate Truffle cake customize ho sakta hai aaj shaam 6 PM tak?
20/03/2026, 10:16 - Agarwal Bikaner Sweets & Bakery: Haan Rahul ji, photo bhej dijiye aur name bata dijiye. 100% pure eggless Chocolate Truffle cake 1 kg ₹650 ka hai, 5:30 PM tak ready ho jayega.
20/03/2026, 12:40 - Neha Kapoor: Shaam ke liye 30 pieces Garam Samosa aur Dhokla ka bulk order mil sakta hai?
20/03/2026, 12:41 - Agarwal Bikaner Sweets & Bakery: Haan madam, Samosa ₹15 per piece aur Dhokla ₹240 per kg hai. 2 ghante pehle confirm kar dijiye, fresh garam deliver karwa denge.
20/03/2026, 15:20 - Sanjay Rathore: Rasgulla aur Gulab Jamun tin pack mein milte hain kya travel ke liye?
20/03/2026, 15:21 - Agarwal Bikaner Sweets & Bakery: Haan Sanjay ji, Bikano aur Haldiram ke 1 kg sealed tin packs ₹210 mein available hain jo travel ke liye leak-proof hote hain.
20/03/2026, 18:05 - Vandana Jain: Dukaan subah kitne baje khulti hai nashte ke liye?
20/03/2026, 18:06 - Agarwal Bikaner Sweets & Bakery: Dukaan roz subah 7:00 AM se raat 10:30 PM tak open rehti hai. Subah 7:30 baje se garam Jalebi, Poha aur Bedmi Poori nashta shuru ho jata hai.
20/03/2026, 19:30 - Gaurav Ahuja: Kya Swiggy / Zomato par delivery hai ya direct delivery kar doge?
20/03/2026, 19:31 - Agarwal Bikaner Sweets & Bakery: Aap direct WhatsApp par order de sakte hain. ₹300 se upar 3 km mein free delivery hai, 30 minutes mein deliver ho jata hai. UPI: agarwalsweets@paytm.`,

    "mobile_repair": `[22/03/26, 11:00:20] Aman Khan: Bhaiya Redmi Note 12 Pro ka display screen toot gaya hai. Repairing ka kitna kharcha aayega?
[22/03/26, 11:01:15] Star Telecom & Mobile Care: Namaste Aman bhai! Original quality display with 3 months warranty ₹2,200 ka hai aur first-copy display ₹1,400 ka hai. 45 minutes mein hand-to-hand fit karke de denge.
[22/03/26, 12:15:40] Pooja Saini: iPhone 13 ke liye original 20W Apple fast charger aur cable available hai?
[22/03/26, 12:16:30] Star Telecom & Mobile Care: Haan Pooja ji, Apple original 20W USB-C adapter ₹1,700 ka hai with 1 year Apple bill warranty. Boat aur Ambrane ke fast chargers ₹499 se shuru hain.
[22/03/26, 14:10:05] Vicky Chaudhary: UV Tempered Glass aur back cover lagwane aana hai. Dukaan kab tak khuli hai?
[22/03/26, 14:10:55] Star Telecom & Mobile Care: Dukaan subah 10:00 AM se raat 9:30 PM tak open rehti hai, 7 days open. UV curved tempered glass ₹180 mein with perfect glue installation lagate hain.
[22/03/26, 16:30:12] Rohit Yadav: Kya second-hand used mobile phone milte hain warranty ke sath?
[22/03/26, 16:31:00] Star Telecom & Mobile Care: Haan Rohit bhai, verified second-hand OnePlus, Samsung aur iPhones with 6 months shop warranty aur GST bill ke sath available hain. Exchange facility bhi hai.
[22/03/26, 18:45:20] Nikhil Jain: Samsung battery drain issue ho raha hai. Battery replacement kitne mein hoga?
[22/03/26, 18:46:10] Star Telecom & Mobile Care: Samsung original battery replacement ₹950 se ₹1,300 ke beech model ke hisaab se hota hai, 6 months guarantee ke sath.
[22/03/26, 20:00:15] Farhan Ali: Payment card ya credit card EMI se ho sakti hai?
[22/03/26, 20:01:00] Star Telecom & Mobile Care: Haan ji, Credit Card, Debit Card, Bajaj Finserv EMI, Google Pay, PhonePe aur Cash sab chalta hai.`,

    "garments": `[24/03/26, 11:20:15] Suman Rastogi: Namaste Radhika ji, boutique kab tak khula rehta hai?
[24/03/26, 11:21:05] Radhika Ethnic & Boutique: Namaste Suman ji! Hamara boutique subah 10:30 AM se raat 9:00 PM tak open rehta hai. Mangalwar (Tuesday) ko hamara weekly off hota hai.
[24/03/26, 12:10:40] Divya Sharma: Ek designer blouse aur suit ki fitting karwani thi urgent. Stitching charges kya hain?
[24/03/26, 12:11:30] Radhika Ethnic & Boutique: Simple blouse stitching ₹450 se shuru hai aur designer/padded blouse ₹750 se. Kurti/suit alteration ₹100-₹150 mein 24 ghante ke andar ho jati hai.
[24/03/26, 14:15:22] Anjali Mehra: Pure silk aur organza sarees ka collection available hai kya party wear ke liye?
[24/03/26, 14:16:15] Radhika Ethnic & Boutique: Haan Anjali ji! Banarasi silk, Kanjivaram replica, aur trending Organza floral sarees ₹1,500 se ₹8,500 ke range mein latest collection mein hain. WhatsApp par catalog bhej dete hain.
[24/03/26, 16:30:10] Meera Agarwal: Kya kapda wapas ya size exchange ho sakta hai agar fitting theek na lage?
[24/03/26, 16:31:00] Radhika Ethnic & Boutique: Haan, purchase ke 7 din ke andar bill aur tag ke sath exchange ho sakta hai. Altered kapde exchange nahi hote par fitting hum free fix karke dete hain.
[24/03/26, 18:40:05] Rekha Singhania: Saree fall pico aur roll press facility hai?
[24/03/26, 18:40:50] Radhika Ethnic & Boutique: Haan ji, Saree Fall-Pico ₹80 per saree aur Charak/Roll Press ₹120 mein next day delivery mil jati hai.
[24/03/26, 20:10:15] Tanvi Shah: Online order delivery available hai kya out of Jaipur?
[24/03/26, 20:11:00] Radhika Ethnic & Boutique: Haan bilkul, all India courier delivery available hai. ₹1,000 se upar free shipping hai. Payment via Google Pay / UPI: radhikaboutique@axisbank.`,

    "stationery": `25/03/2026, 08:45 - Harsh Vardhan: Bhaiya dukaan khul gayi hai kya? College project spiral binding karwani thi.
25/03/2026, 08:46 - Student Corner Stationery & Xerox: Namaste! Haan dukaan subah 8:00 AM se raat 10:00 PM tak poora din open rehti hai.
25/03/2026, 09:15 - Priya Sen: WhatsApp par PDF bhej du toh printout nikaal kar rakh doge? Rate kya hai?
25/03/2026, 09:16 - Student Corner Stationery & Xerox: Haan WhatsApp par document bhej dijiye. Black & White printout ₹2 per page (both side ₹3) aur Colour printout ₹10 per page hai.
25/03/2026, 11:30 - Manish Tiwari: 150 pages thesis project ki Hardcover Golden Emboss binding kitne mein hogi?
25/03/2026, 11:31 - Student Corner Stationery & Xerox: Hardcover Golden Emboss binding ₹220 per book hai. 3 ghante mein ready mil jayegi. Soft Spiral binding ₹35 ki hai.
25/03/2026, 14:20 - Sunita Sharma: Class 10 NCERT books aur Classmate register copies available hain?
25/03/2026, 14:21 - Student Corner Stationery & Xerox: Haan madam, NCERT class 6 to 12 ki sabhi books available hain. Classmate 6-pack long notebooks ₹360 mein MRP discount par mil jayenge.
25/03/2026, 17:05 - Rahul Das: Passport size photo urgent 10 minute mein ban sakti hai form bharne ke liye?
25/03/2026, 17:06 - Student Corner Stationery & Xerox: Haan Rahul ji, 8 copies passport size photo ₹50 mein 10 minute mein glossy paper par ready mil jayegi.
25/03/2026, 19:40 - Abhishek Roy: Lamination aur PVC Aadhar card print hota hai?
25/03/2026, 19:41 - Student Corner Stationery & Xerox: Haan ji, Document lamination ₹20 aur Smart PVC Aadhar/PAN card print ₹50 mein hand-to-hand ho jata hai. UPI: studentcorner@paytm.`,

    "south_indian": `[26/03/26, 07:30:10] Karthik Raman: Vanakkam Murugan anna, store open aayiducha? (Store open yet?)
[26/03/26, 07:31:00] Murugan Stores & Provisions: Vanakkam thambi! Yes, store opens daily 7:00 AM to 10:00 PM. All fresh items available.
[26/03/26, 08:15:20] Lakshmi Narayanan: Fresh Idli/Dosa batter packet and Filter Coffee powder available ah?
[26/03/26, 08:16:10] Murugan Stores & Provisions: Yes madam, fresh Asal Idli/Dosa batter 1kg pouch ₹45 and Kumbakonam Degree Filter Coffee Powder 500g ₹290 fresh ground stock available.
[26/03/26, 10:40:05] Balaji Srinivasan: What is the price of 25kg Deluxe Ponni Boiled Rice bag and Idhayam Gingelly oil?
[26/03/26, 10:41:00] Murugan Stores & Provisions: Deluxe Ponni Boiled Rice 25kg bag is ₹1,480. Idhayam Gingelly Oil 1 Litre pouch is ₹265.
[26/03/26, 13:20:45] Meenakshi Sundaram: Anna, can you deliver home to Anna Nagar 2nd Avenue?
[26/03/26, 13:21:30] Murugan Stores & Provisions: Yes madam, free home delivery within 3 km for orders above ₹400. Delivery time is 30 to 45 minutes.
[26/03/26, 16:50:10] Rajesh Kannan: Do you accept GPay or PhonePe payment?
[26/03/26, 16:51:00] Murugan Stores & Provisions: Yes sir, Google Pay, PhonePe, Paytm QR scan and Cash on Delivery accepted. UPI ID: muruganstore@ybl.
[26/03/26, 19:30:20] Divya Venkatesh: Aachi Sambar powder and Appalam packet available?
[26/03/26, 19:31:00] Murugan Stores & Provisions: Yes sister, Aachi and MTR Sambar powders (100g, 200g, 500g) and Ambika Appalam always in stock.`
};
