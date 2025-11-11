rom datetime import datetime, timedelta, timezone
from typing import Annotated, Optional, Tuple
import uuid, secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from .settings import settings
from .database import get_db
from .models import User, RefreshToken

# Tells FastAPI how to read "Authorization: Bearer <access_token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/issue")

# passlib context to hash and verify refresh token secrets
_pwd = CryptContext(schemes=["sha256_crypt"], deprecated="auto")
#Pydantic models (responses & claims)

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: EmailStr
    exp: int
    jti: str
    iss: str
    aud: str

def _as_aware(dt: datetime) -> datetime:
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)

def _as_aware(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _now() -> datetime:
    return datetime.now(timezone.utc)

#Access tokens (JWT)

def _create_access_token(email: str, jti: Optional[str] = None) -> str:
    jti = jti or str(uuid.uuid4())
    payload = {
        "sub": email,
        "exp": _now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
        "jti": jti,
        "iss": settings.TOKEN_ISSUER,
        "aud": settings.TOKEN_AUDIENCE,
        "iat": int(_now().timestamp()),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def _decode_access_token(token: str) -> TokenData:
    try:
        data = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            audience=settings.TOKEN_AUDIENCE,
            issuer=settings.TOKEN_ISSUER,
        )
        return TokenData(**data)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")

async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    data = _decode_access_token(token)
    user = db.query(User).filter(User.email == data.sub).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

#Refresh tokens (opaque, hashed in DB)

def _split_refresh_token(raw: str) -> Tuple[str, str]:
    if "." not in raw:
        raise HTTPException(status_code=401, detail="Malformed refresh token")
    j, s = raw.split(".", 1)
    if not j or not s:
        raise HTTPException(status_code=401, detail="Malformed refresh token")
    return j, s

def _new_refresh_token(db: Session, user: User, parent: Optional[RefreshToken] = None) -> str:
    jti = uuid.uuid4().hex[:32]         # compact 32-char id
    secret = secrets.token_urlsafe(48)  # raw secret (only shown once to the client)
    hashed = _pwd.hash(secret)          # store only the hash
    rt = RefreshToken(
        jti=jti,
        token_hash=hashed,
        user_id=user.id,
        parent_jti=parent.jti if parent else None,
        expires_at=_now() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()
    # Return the "opaque" token: client stores this exact string.
    return f"{jti}.{secret}"

def issue_session(db: Session, email: str, full_name: str | None = None, ms_oid: str | None = None) -> TokenPair:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, full_name=full_name, ms_oid=ms_oid)
        db.add(user)
        db.commit()
        db.refresh(user)
    access = _create_access_token(user.email)
    refresh = _new_refresh_token(db, user)
    return TokenPair(access_token=access, refresh_token=refresh)

def rotate_refresh(db: Session, raw_refresh: str) -> TokenPair:
    jti, secret = _split_refresh_token(raw_refresh)
    # Find the DB row for this token id (non-secret lookup)
    rt = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not rt or rt.revoked_at:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    # Normalize Timezones before comparing
    expires_at = _as_aware(rt.expires_at)
    if expires_at <= _now():
        rt.revoked_at = _now()
        db.commit()
        raise HTTPException(status_code=401, detail="Expired refresh token")
    # Verify provided secret against the bcrypt hash in DB
    if not _pwd.verify(secret, rt.token_hash):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    # Rotation: mark this token as used, then issue a new one
    rt.revoked_at = _now()
    db.commit()
    user = db.query(User).filter(User.id == rt.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    new_access = _create_access_token(user.email)
    new_refresh = _new_refresh_token(db, user, parent=rt)
    return TokenPair(access_token=new_access, refresh_token=new_refresh)

def revoke_this_device(db: Session, raw_refresh: str) -> None:
    jti, secret = _split_refresh_token(raw_refresh)
    rt = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
    if not rt or rt.revoked_at:
        return
    if not _pwd.verify(secret, rt.token_hash):
        return
    rt.revoked_at = _now()
    db.commit()

def revoke_all_devices(db: Session, user: User) -> None:
    tokens = db.query(RefreshToken).filter(
        RefreshToken.user_id == user.id,
        RefreshToken.revoked_at.is_(None)
    ).all()
    for t in tokens:
        t.revoked_at = _now()
    db.commit()
