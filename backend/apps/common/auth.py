import os

from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

ROLE_SIGNER = TimestampSigner(salt="footy-app-role")
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30

EDITOR = "editor"
VIEWER = "viewer"


def get_editor_secret() -> str:
    return os.getenv("EDITOR_SECRET", "")


def issue_role_token(role: str) -> str:
    return ROLE_SIGNER.sign(role)


def verify_role_token(token: str) -> str | None:
    if not token:
        return None
    try:
        role = ROLE_SIGNER.unsign(token, max_age=TOKEN_MAX_AGE_SECONDS)
    except (BadSignature, SignatureExpired):
        return None
    if role not in (EDITOR, VIEWER):
        return None
    return role


def get_request_role(request) -> str | None:
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return verify_role_token(auth_header[7:].strip())
    return None
