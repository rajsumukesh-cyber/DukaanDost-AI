try:
    from twilio.twiml.messaging_response import MessagingResponse
    from twilio.rest import Client
except ImportError:
    MessagingResponse = None
    Client = None

from typing import Optional
from config import settings
from rag_service import rag_service
from stt_service import stt_service

class WhatsAppBotHandler:
    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.client = None
        if Client and self.account_sid and self.auth_token and self.account_sid != "ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX":
            try:
                self.client = Client(self.account_sid, self.auth_token)
            except Exception as e:
                print(f"[Twilio Init Error] {e}")

    def notify_owner_fallback(self, customer_phone: str, query: str):
        """
        Send a direct WhatsApp alert to the shopkeeper's personal number
        when the bot cannot answer a question
        """
        if not self.client:
            print(f"[Fallback Simulation] Sent WhatsApp Alert to {settings.FALLBACK_OWNER_WHATSAPP}: Customer ({customer_phone}) asked: '{query}'")
            return

        try:
            body = (
                f"🚨 *DukaanDost - Unresolved Customer Query*\n\n"
                f"👤 Customer: {customer_phone}\n"
                f"❓ Question: {query}\n\n"
                f"👉 Please reply directly or open your DukaanDost portal to answer."
            )
            self.client.messages.create(
                from_=settings.TWILIO_WHATSAPP_NUMBER,
                to=settings.FALLBACK_OWNER_WHATSAPP,
                body=body
            )
        except Exception as e:
            print(f"[Twilio Notification Error] {e}")

    def process_incoming_webhook(self, form_data: dict) -> str:
        """
        Main handler for Twilio WhatsApp Webhooks
        Handles text messages and audio voice notes (NumMedia > 0)
        """
        sender = form_data.get("From", "whatsapp:+919999999999")
        incoming_text = form_data.get("Body", "").strip()
        num_media = int(form_data.get("NumMedia", 0))
        is_voice = False

        # If audio voice note attachment received
        if num_media > 0:
            media_url = form_data.get("MediaUrl0")
            media_content_type = form_data.get("MediaContentType0", "")
            
            if "audio" in media_content_type or "ogg" in media_content_type:
                is_voice = True
                print(f"[Twilio Media] Processing incoming voice note from {sender}...")
                incoming_text = stt_service.transcribe_twilio_media(media_url)

        if not incoming_text:
            incoming_text = "Dukaan timings kya hain?"

        # Pass through RAG Pipeline
        rag_result = rag_service.generate_response(
            query=incoming_text,
            shop_id=settings.DEFAULT_SHOP_ID,
            customer_phone=sender,
            is_voice=is_voice
        )

        # Trigger owner fallback notification if question was unanswerable
        if rag_result.get("is_fallback"):
            self.notify_owner_fallback(customer_phone=sender, query=incoming_text)

        # Build TwiML Response
        if MessagingResponse:
            resp = MessagingResponse()
            msg = resp.message()
            msg.body(rag_result["answer"])
            return str(resp)
        else:
            return f'<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>{rag_result["answer"]}</Body></Message></Response>'

whatsapp_bot = WhatsAppBotHandler()
