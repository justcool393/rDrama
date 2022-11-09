from sqlalchemy.orm import scoped_session
from files.classes import Marsey

marseys_const = []
marseys_const2 = []

def const_initialize(db:scoped_session):
	marseys_const = [x[0] for x in db.query(Marsey.name).filter(Marsey.submitter_id==None, Marsey.name!='chudsey').all()]
	marseys_const2 = marseys_const + ['chudsey','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9','exclamationpoint','period','questionmark']
	marseys = db.query(Marsey).filter(Marsey.submitter_id==None).all()
	marsey_mappings = {}
	for marsey in marseys:
		for tag in marsey.tags.split():
			if tag in marsey_mappings:
				marsey_mappings[tag].append(marsey.name)
			else:
				marsey_mappings[tag] = [marsey.name]
