from typing import Optional

from flask import session

from files.classes import User
from files.helpers.security import generate_hash, validate_hash


def get_raw_formkey(u:User):
	return f"{session['session_id']}+{u.id}+{u.login_nonce}"

def get_formkey(u:Optional[User]):
	if not u: return "" # if no user exists, give them a blank formkey
	return generate_hash(get_raw_formkey(u))

def validate_formkey(u:User, formkey:Optional[str]) -> bool:
	if not formkey: return False
	return validate_hash(get_raw_formkey(u), formkey)
