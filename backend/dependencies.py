from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from services.supabase_client import get_supabase

supabase = get_supabase()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/login')


def _ensure_user_row(user_id: str | None, email: str | None):
    if not user_id:
        return

    try:
        payload = {'id': user_id}
        if email:
            payload['email'] = email

        # Keep the app-level users table in sync with Supabase auth users
        # so downstream inserts with foreign keys do not fail.
        supabase.table('users').upsert(payload).execute()
    except Exception as e:
        print(f'User sync skipped: {e}')


def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # Ask Supabase directly to verify the token (Handles ES256).
        user_res = supabase.auth.get_user(token)

        if not user_res or not user_res.user:
            raise Exception('Token rejected by Supabase')

        user_id = user_res.user.id
        email = user_res.user.email

        _ensure_user_row(user_id=user_id, email=email)

        return {
            'id': user_id,
            'sub': user_id,
            'email': email,
            'token': token,
        }
    except Exception as e:
        print(f'Auth failed! Reason: {str(e)}')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid or expired session. Please log in again.',
        )
