"""
DukaanBot Database Seeder
Seeds 3 sample small business accounts with rich multilingual FAQ datasets and query logs.
"""
from database import init_db, get_db, insert_faq
from auth import get_password_hash

def seed_database():
    init_db()
    conn = get_db()
    cursor = conn.cursor()

    # Clear existing demo data
    cursor.execute("DELETE FROM users")
    cursor.execute("DELETE FROM shops")
    cursor.execute("DELETE FROM faqs")
    cursor.execute("DELETE FROM query_logs")
    cursor.execute("DELETE FROM fallback_queries")

    # 1. Shop 1: Sharma Kirana & General Store (Noida)
    shop1_id = "kirana-sharma"
    cursor.execute("""
    INSERT INTO shops (id, name, owner, phone, address, timings, category, upi_id, delivery_rules, primary_language, widget_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        shop1_id,
        "Sharma Kirana & General Store",
        "Ramesh Sharma",
        "9876543210",
        "Shop 14, Main Market, Sector 4, Noida, UP",
        "Mon-Sat: 7:30 AM - 10:30 PM | Sun: 8:00 AM - 10:00 PM",
        "Grocery & Daily Needs",
        "sharmastore@okhdfcbank",
        "Free delivery on orders above ₹300 within 3 km. 30-45 mins delivery.",
        "hi",
        "#10B981"
    ))
    cursor.execute("""
    INSERT INTO users (id, phone, password_hash, shop_id, language_preference)
    VALUES (?, ?, ?, ?, ?)
    """, (
        "user-sharma",
        "9876543210",
        get_password_hash("kirana123"),
        shop1_id,
        "hi"
    ))

    # 2. Shop 2: Gupta Medicos & Healthcare (Lucknow)
    shop2_id = "pharmacy-gupta"
    cursor.execute("""
    INSERT INTO shops (id, name, owner, phone, address, timings, category, upi_id, delivery_rules, primary_language, widget_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        shop2_id,
        "Gupta Medicos & Healthcare",
        "Dr. Alok Gupta",
        "9415011223",
        "Plot 88, Civil Lines, Near District Hospital, Lucknow, UP",
        "Daily: 8:00 AM - 11:30 PM (24/7 emergency medicine on call)",
        "Pharmacy & Healthcare",
        "guptamedicos@icici",
        "Free delivery on orders above ₹200 within 5 km. 30 mins delivery.",
        "hi",
        "#0284C7"
    ))
    cursor.execute("""
    INSERT INTO users (id, phone, password_hash, shop_id, language_preference)
    VALUES (?, ?, ?, ?, ?)
    """, (
        "user-gupta",
        "9415011223",
        get_password_hash("medicos123"),
        shop2_id,
        "hi"
    ))

    # 3. Shop 3: Murugan Stores & Provisions (Chennai)
    shop3_id = "murugan-provisions"
    cursor.execute("""
    INSERT INTO shops (id, name, owner, phone, address, timings, category, upi_id, delivery_rules, primary_language, widget_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        shop3_id,
        "Murugan Stores & Provisions",
        "Murugan Swamy",
        "9444012345",
        "12, 4th Main Road, Anna Nagar, Chennai, TN",
        "Mon-Sun: 7:00 AM - 10:00 PM",
        "South Indian Grocery & Provisions",
        "muruganstore@ybl",
        "Free home delivery above ₹400 in Anna Nagar. 30-45 mins delivery.",
        "ta",
        "#EA580C"
    ))
    cursor.execute("""
    INSERT INTO users (id, phone, password_hash, shop_id, language_preference)
    VALUES (?, ?, ?, ?, ?)
    """, (
        "user-murugan",
        "9444012345",
        get_password_hash("murugan123"),
        shop3_id,
        "ta"
    ))

    conn.commit()

    # Seed FAQs for Shop 1 (Kirana)
    kirana_faqs = [
        ("Dukaan khulne aur band hone ka time kya hai?", "Hamari dukaan subah 7:30 AM se raat 10:30 PM tak khuli rehti hai. Sunday ko 8:00 AM se 10:00 PM tak open rehti hai.", "Timings", "timing,open,close,hours,samay,sunday"),
        ("Kya home delivery available hai aur charge kitna hai?", "Haan ji! 3 km ke radius mein ₹300 se upar ke order par FREE home delivery hai. ₹300 se kam order par ₹20 delivery charge hai.", "Delivery", "delivery,charge,free,ghar,order"),
        ("Amul doodh aur butter packet available hai kya?", "Haan ji! Amul Taaza, Amul Gold, Amul Butter (100g & 500g) aur taaza Paneer hamesha fresh stock mein available hai.", "Stock", "milk,doodh,amul,butter,paneer,dairy"),
        ("Aashirvaad Atta 10kg aur Fortune Oil ka rate kya hai?", "Aashirvaad Shudh Chakki Atta 10kg ₹410 ka hai aur Fortune Kachi Ghani Mustard Oil 1L pouch ₹142 ka hai.", "Pricing", "atta,oil,rate,price,daam,fortune"),
        ("Payment online Google Pay ya PhonePe se ho jayega?", "Haan ji! Google Pay, PhonePe, Paytm, QR scan aur Cash on Delivery (COD) sabhi accept hota hai. UPI ID: sharmastore@okhdfcbank", "Payments", "pay,payment,upi,gpay,phonepe,cash,qr"),
        ("Aapki dukaan ka exact location kahan hai?", "Hamari dukaan Shop No. 14, Main Market, Near SBI ATM, Sector 4, Noida mein sthit hai.", "Location", "location,address,pata,landmark,kahan")
    ]
    for q, a, cat, kw in kirana_faqs:
        insert_faq(shop1_id, q, a, cat, kw)

    # Seed FAQs for Shop 2 (Pharmacy)
    pharmacy_faqs = [
        ("Pharmacy opening hours kya hain emergency ke liye?", "Hum roz subah 8:00 AM se raat 11:30 PM tak open rehte hain. Night emergency ke liye helpline: 9415011223 par call karein.", "Timings", "timing,open,close,emergency,night,hours"),
        ("Kya prescription medicines ki home delivery hoti hai?", "Haan ji! WhatsApp par doctor ke parche/prescription ki photo bhej dijiye. ₹200 se upar 30-45 mins mein free delivery mil jayegi.", "Delivery", "delivery,prescription,parcha,ghar,free"),
        ("Dolo 650, BP machine aur Sugar test strips available hain?", "Haan ji! Dolo 650 strips, Omron Digital BP Monitor (₹1,850) aur Accu-Chek test strips (₹980) fresh stock mein hain.", "Stock", "dolo,bp,sugar,omron,strip,paracetamol"),
        ("Baby diapers aur Cerelac milta hai?", "Haan, Pampers aur MamyPoko Pants ke all sizes aur Nestle Cerelac fresh stock mein available hai.", "Stock", "baby,diaper,pampers,cerelac,infant")
    ]
    for q, a, cat, kw in pharmacy_faqs:
        insert_faq(shop2_id, q, a, cat, kw)

    # Seed FAQs for Shop 3 (Murugan Provisions)
    murugan_faqs = [
        ("Store opening timings enna? (When does the store open?)", "Vanakkam! Store opens daily from 7:00 AM to 10:00 PM without weekly holiday.", "Timings", "timing,open,close,hours,samay"),
        ("Fresh Idli Dosa batter packet and Kumbakonam filter coffee powder available ah?", "Yes! Fresh Asal Idli/Dosa batter 1kg pouch ₹45 and Kumbakonam Degree Filter Coffee Powder 500g ₹290 available.", "Stock", "idli,dosa,batter,coffee,kumbakonam"),
        ("What is the price of 25kg Deluxe Ponni Boiled rice and Idhayam Gingelly oil?", "Deluxe Ponni Boiled Rice 25kg bag is ₹1,480. Idhayam Gingelly Oil 1 Litre pouch is ₹265.", "Pricing", "rice,ponni,gingelly,oil,rate,price"),
        ("Do you deliver to home in Anna Nagar?", "Yes madam! Free home delivery for orders above ₹400 within Anna Nagar. Delivery within 30-45 mins.", "Delivery", "delivery,home,free,anna nagar")
    ]
    for q, a, cat, kw in murugan_faqs:
        insert_faq(shop3_id, q, a, cat, kw)

    # Seed Sample Query Logs for Analytics
    sample_queries = [
        (shop1_id, "Dukaan khulne ka time kya hai?", "Hamari dukaan subah 7:30 AM se raat 10:30 PM tak khuli rehti hai.", "hi", False, 0.95, False),
        (shop1_id, "Amul doodh available hai?", "Haan ji! Amul Taaza aur Gold fresh stock mein available hai.", "hi", True, 0.92, False),
        (shop1_id, "Home delivery charges kitne hain?", "3 km ke andar ₹300 se upar free delivery hai.", "hi", False, 0.88, False),
        (shop1_id, "Aashirvaad aata ka rate batao", "Aashirvaad 10kg ₹410 ka hai.", "hi", True, 0.89, False),
        (shop1_id, "Google Pay chalta hai?", "Haan ji, UPI, GPay, PhonePe sab accept hota hai.", "hi", False, 0.91, False),
        (shop1_id, "Do you sell iPhone chargers?", "Maaf kijiye, mujhe iski jankari nahi hai. Kripya dukaandar ji se sampark karein.", "en", False, 0.20, True),
        (shop1_id, "Sunday ko open rehte ho?", "Haan Sunday ko subah 8:00 AM se raat 10:00 PM tak open rehti hai.", "hi", False, 0.90, False)
    ]

    for sid, q, a, lang, is_v, conf, is_fb in sample_queries:
        cursor.execute("""
        INSERT INTO query_logs (shop_id, customer_id, query_text, answer_text, language_detected, is_voice, confidence_score, is_fallback)
        VALUES (?, 'sample_cust', ?, ?, ?, ?, ?, ?)
        """, (sid, q, a, lang, is_v, conf, is_fb))

    # Seed 1 fallback alert
    cursor.execute("""
    INSERT INTO fallback_queries (shop_id, customer_phone, query_text)
    VALUES (?, '+91 98231 99012', 'Do you sell iPhone chargers?')
    """, (shop1_id,))

    conn.commit()
    conn.close()
    print("[SUCCESS] Database seeded with 3 demo shops, 14 FAQs, and analytics!")

if __name__ == "__main__":
    seed_database()
