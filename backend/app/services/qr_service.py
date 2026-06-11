import qrcode # pyright: ignore[reportMissingModuleSource]
import os

def generate_qr(referral_code):

    url = f"http://localhost:5173/register?ref={referral_code}"

    folder = "qr_codes"

    os.makedirs(folder, exist_ok=True)

    filename = f"{folder}/{referral_code}.png"

    qr = qrcode.make(url)

    qr.save(filename)

    return filename