from sqlalchemy.orm import scoped_session
from files.classes import Marsey
from files.helpers.const import SITE_NAME
from os import path
from json import load

marseys_const = []
marseys_const2 = []
marsey_mappings = {}
SNAPPY_MARSEYS = []
SNAPPY_QUOTES = []
CONFIG = {}

def const_initialize(db:scoped_session):
	reload_config()
	_initialize_marseys(db)
	_initialize_snappy_marseys_and_quotes()

def reload_config():
	global CONFIG
	CONFIG_PATH = '/site_settings.json'
	if not path.isfile(CONFIG_PATH):
		with open(CONFIG_PATH, 'w', encoding='utf_8') as f:
			f.write(
				'{"Bots": true, "Fart mode": false, "Read-only mode": false, ' + \
				'"Signups": true, "login_required": false}')
	with open(CONFIG_PATH, 'r', encoding='utf_8') as f:
		CONFIG = load(f)
		print("loaded config")

def _initialize_marseys(db:scoped_session):
	global marseys_const, marseys_const2, marsey_mappings
	marseys_const = [x[0] for x in db.query(Marsey.name).filter(Marsey.submitter_id==None, Marsey.name!='chudsey').all()]
	marseys_const2 = marseys_const + ['chudsey','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9','exclamationpoint','period','questionmark']
	marseys = db.query(Marsey).filter(Marsey.submitter_id==None).all()
	for marsey in marseys:
		for tag in marsey.tags.split():
			if tag in marsey_mappings:
				marsey_mappings[tag].append(marsey.name)
			else:
				marsey_mappings[tag] = [marsey.name]

def _initialize_snappy_marseys_and_quotes():
	global SNAPPY_MARSEYS, SNAPPY_QUOTES
	if SITE_NAME != 'PCM':
		SNAPPY_MARSEYS = [f':#{x}:' for x in marseys_const2]

	if path.isfile(f'snappy_{SITE_NAME}.txt'):
		with open(f'snappy_{SITE_NAME}.txt', "r", encoding="utf-8") as f:
			SNAPPY_QUOTES = f.read().split("\n{[para]}\n")
