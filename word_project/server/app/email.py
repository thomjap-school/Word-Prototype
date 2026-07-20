""" app/email.py """

import os
import smtplib
from email.message import EmailMessage

from dotenv import load_dotenv

from app import models

load_dotenv()

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def send_email(to: str, subject: str, html_body: str) -> None:
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        print(f"[email] SMTP non configuré, email non envoyé à {to} : {subject}\n{html_body}")
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = to
    message.set_content("Ce message nécessite un client email compatible HTML.")
    message.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(message)


def send_verification_email(user: "models.User", token: str) -> None:
    link = f"{FRONTEND_URL}/verify-email?token={token}"
    html_body = f"""
    <p>Bonjour {user.full_name or user.email},</p>
    <p>Merci de confirmer ton adresse email pour activer ton compte WordV2 :</p>
    <p><a href="{link}">{link}</a></p>
    <p>Ce lien expire dans 24 heures.</p>
    """
    send_email(user.email, "Confirme ton compte WordV2", html_body)
