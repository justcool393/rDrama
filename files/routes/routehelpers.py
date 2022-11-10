from files.classes import User
from flask import session
from files.helpers.security import generate_hash, validate_hash

def get_formkey(u:User):
	return generate_hash(f"{session['session_id']}+{u.id}+{u.login_nonce}")

def validate_formkey(u:User, formkey:str) -> bool:
	return validate_hash(get_formkey(u), formkey)
