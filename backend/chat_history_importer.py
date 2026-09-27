import re
from typing import List, Dict, Any
from database import add_faq

class ChatHistoryImporter:
    def __init__(self):
        self.patterns = [
            re.compile(r'^\[(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s+([^:]+):\s+(.*)$'),
            re.compile(r'^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?:\s*[APap][Mm])?)\s+-\s+([^:]+):\s+(.*)$'),
            re.compile(r'^(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}\s+[APap][Mm])\s+-\s+([^:]+):\s+(.*)$')
        ]
        self.question_indicators = ["?", "kya", "kab", "kahan", "kitne", "rate", "price", "delivery", "timing", "stock", "available"]

    def parse_messages(self, text: str) -> List[Dict[str, str]]:
        messages = []
        current = None

        for line in text.splitlines():
            line = line.strip()
            if not line:
                continue

            matched = False
            for pattern in self.patterns:
                match = pattern.match(line)
                if match:
                    if current:
                        messages.append(current)
                    current = {
                        "date": match.group(1),
                        "time": match.group(2),
                        "sender": match.group(3).strip(),
                        "text": match.group(4).strip()
                    }
                    matched = True
                    break

            if not matched and current:
                current["text"] += " " + line

        if current:
            messages.append(current)

        return messages

    def categorize_dialogue(self, text: str) -> str:
        t = text.lower()
        if any(k in t for k in ["time", "timing", "open", "close", "khul", "band"]):
            return "timings"
        if any(k in t for k in ["deliver", "ghar", "bhejo", "reach"]):
            return "delivery"
        if any(k in t for k in ["rate", "price", "daam", "kitne", "₹", "rs"]):
            return "pricing"
        if any(k in t for k in ["pay", "upi", "gpay", "phonepe", "cash", "qr"]):
            return "payment"
        if any(k in t for k in ["pata", "kahan", "address", "location"]):
            return "location"
        return "stock"

    def extract_and_import_faqs(self, text: str, shop_id: str) -> Dict[str, Any]:
        messages = self.parse_messages(text)
        if len(messages) < 2:
            return {"success": False, "extracted_count": 0, "message": "Not enough messages found."}

        # Identify shopkeeper as sender with keywords or most messages
        senders = {}
        for m in messages:
            senders[m["sender"]] = senders.get(m["sender"], 0) + 1

        shopkeeper = max(senders, key=senders.get)
        extracted = []

        for i in range(len(messages) - 1):
            curr_msg = messages[i]
            next_msg = messages[i + 1]

            # If customer asked a question and shopkeeper replied
            if curr_msg["sender"] != shopkeeper and any(qi in curr_msg["text"].lower() for qi in self.question_indicators):
                if next_msg["sender"] == shopkeeper and len(next_msg["text"]) > 4:
                    cat = self.categorize_dialogue(curr_msg["text"] + " " + next_msg["text"])
                    kw = ",".join(list(set([w for w in re.findall(r'\w+', curr_msg["text"].lower()) if len(w) > 3]))[:5])
                    
                    faq_id = add_faq(
                        shop_id=shop_id,
                        category=cat,
                        question=curr_msg["text"],
                        question_hi=curr_msg["text"],
                        answer=next_msg["text"],
                        answer_hi=next_msg["text"],
                        keywords=kw
                    )
                    extracted.append({
                        "id": faq_id,
                        "question": curr_msg["text"],
                        "answer": next_msg["text"],
                        "category": cat
                    })

        return {
            "success": True,
            "extracted_count": len(extracted),
            "faqs": extracted
        }

chat_importer = ChatHistoryImporter()
