from shutil import move, copyfile

from files.__main__ import app, limiter
from files.helpers.const import *
from files.helpers.actions import *
from files.helpers.media import *
from files.helpers.wrappers import *
from files.routes.static import marsey_list

@app.get('/asset_submissions/<path:path>')
@limiter.exempt
def asset_submissions(path):
	resp = make_response(send_from_directory('/asset_submissions', path))
	resp.headers.remove("Cache-Control")
	resp.headers.add("Cache-Control", "public, max-age=3153600")
	resp.headers.remove("Content-Type")
	resp.headers.add("Content-Type", "image/webp")
	return resp

@app.get("/submit/marseys")
@auth_required
def submit_marseys(v):
	if v.admin_level > 2:
		marseys = g.db.query(Marsey).filter(Marsey.submitter_id != None).all()
	else:
		marseys = g.db.query(Marsey).filter(Marsey.submitter_id == v.id).all()

	for marsey in marseys:
		marsey.author = g.db.query(User.username).filter_by(id=marsey.author_id).one()[0]
		marsey.submitter = g.db.query(User.username).filter_by(id=marsey.submitter_id).one()[0]

	return render_template("submit_marseys.html", v=v, marseys=marseys)


@app.post("/submit/marseys")
@auth_required
def submit_marsey(v):

	def error(error):
		if v.admin_level > 2: marseys = g.db.query(Marsey).filter(Marsey.submitter_id != None).all()
		else: marseys = g.db.query(Marsey).filter(Marsey.submitter_id == v.id).all()
		for marsey in marseys:
			marsey.author = g.db.query(User.username).filter_by(id=marsey.author_id).one()[0]
			marsey.submitter = g.db.query(User.username).filter_by(id=marsey.submitter_id).one()[0]
		return render_template("submit_marseys.html", v=v, marseys=marseys, error=error), 400

	if request.headers.get("cf-ipcountry") == "T1":
		return error("Image uploads are not allowed through TOR.")

	file = request.files["image"]
	if not file or not file.content_type.startswith('image/'):
		return error("You need to submit an image!")

	name = request.values.get('name').lower().strip()
	if not marsey_regex.fullmatch(name):
		return error("Invalid name!")

	existing = g.db.query(Marsey.name).filter_by(name=name).one_or_none()
	if existing:
		return error("A marsey with this name already exists!")

	tags = request.values.get('tags').lower().strip()
	if not tags_regex.fullmatch(tags):
		return error("Invalid tags!")

	author = request.values.get('author').strip()
	author = get_user(author)

	highquality = f'/asset_submissions/marseys/{name}.png'
	file.save(highquality)

	filename = f'/asset_submissions/marseys/{name}.webp'
	copyfile(highquality, filename)
	process_image(filename, 200)

	marsey = Marsey(name=name, author_id=author.id, tags=tags, count=0, submitter_id=v.id)
	g.db.add(marsey)

	g.db.flush()
	if v.admin_level > 2: marseys = g.db.query(Marsey).filter(Marsey.submitter_id != None).all()
	else: marseys = g.db.query(Marsey).filter(Marsey.submitter_id == v.id).all()
	for marsey in marseys:
		marsey.author = g.db.query(User.username).filter_by(id=marsey.author_id).one()[0]
		marsey.submitter = g.db.query(User.username).filter_by(id=marsey.submitter_id).one()[0]

	return render_template("submit_marseys.html", v=v, marseys=marseys, msg=f"'{name}' submitted successfully!")


@app.post("/admin/approve/marsey/<name>")
@admin_level_required(3)
def approve_marsey(v, name):
	if CARP_ID and v.id != CARP_ID:
		return {"error": "Only Carp can approve marseys!"}, 403

	name = name.lower().strip()

	marsey = g.db.query(Marsey).filter_by(name=name).one_or_none()
	if not marsey:
		return {"error": f"This marsey '{name}' doesn't exist!"}, 404

	tags = request.values.get('tags').lower().strip()
	if not tags:
		return {"error": "You need to include tags!"}, 400

	new_name = request.values.get('name').lower().strip()
	if not new_name:
		return {"error": "You need to include name!"}, 400


	if not marsey_regex.fullmatch(new_name):
		return {"error": "Invalid name!"}, 400
	if not tags_regex.fullmatch(tags):
		return {"error": "Invalid tags!"}, 400


	marsey.name = new_name
	marsey.tags = tags
	g.db.add(marsey)

	move(f"/asset_submissions/marseys/{name}.webp", f"files/assets/images/emojis/{marsey.name}.webp")

	author = get_account(marsey.author_id)
	all_by_author = g.db.query(Marsey).filter_by(author_id=author.id).count()

	if all_by_author >= 99:
		badge_grant(badge_id=143, user=author)
	elif all_by_author >= 9:
		badge_grant(badge_id=16, user=author)
	else:
		badge_grant(badge_id=17, user=author)

	requests.post(f'https://api.cloudflare.com/client/v4/zones/{CF_ZONE}/purge_cache', headers=CF_HEADERS, 
		data=f'{{"files": ["https://{SITE}/e/{marsey.name}.webp"]}}', timeout=5)
	cache.delete_memoized(marsey_list)

	if v.id != marsey.submitter_id:
		msg = f"@{v.username} has approved a marsey you submitted: :{marsey.name}:"
		send_repeatable_notification(marsey.submitter_id, msg)

	marsey.submitter_id = None

	return {"message": f"'{marsey.name}' approved!"}

@app.post("/admin/reject/marsey/<name>")
@admin_level_required(3)
def reject_marsey(v, name):
	if CARP_ID and v.id != CARP_ID:
		return {"error": "Only Carp can reject marseys!"}, 403

	name = name.lower().strip()

	marsey = g.db.query(Marsey).filter_by(name=name).one_or_none()
	if not marsey:
		return {"error": f"This marsey '{name}' doesn't exist!"}, 404

	if v.id != marsey.submitter_id:
		msg = f"@{v.username} has rejected a marsey you submitted: `'{marsey.name}'`"
		send_repeatable_notification(marsey.submitter_id, msg)

	g.db.delete(marsey)
	os.remove(f"/asset_submissions/marseys/{marsey.name}.webp")

	return {"message": f"'{marsey.name}' rejected!"}




@app.get("/submit/hats")
@auth_required
def submit_hats(v):
	if v.admin_level > 2: hats = g.db.query(HatDef).filter(HatDef.submitter_id != None).all()
	else: hats = g.db.query(HatDef).filter(HatDef.submitter_id == v.id).all()
	return render_template("submit_hats.html", v=v, hats=hats)


@app.post("/submit/hats")
@auth_required
def submit_hat(v):

	def error(error):
		if v.admin_level > 2: hats = g.db.query(HatDef).filter(HatDef.submitter_id != None).all()
		else: hats = g.db.query(HatDef).filter(HatDef.submitter_id == v.id).all()
		return render_template("submit_hats.html", v=v, hats=hats, error=error), 400

	if request.headers.get("cf-ipcountry") == "T1":
		return error("Image uploads are not allowed through TOR.")

	file = request.files["image"]
	if not file or not file.content_type.startswith('image/'):
		return error("You need to submit an image!")

	name = request.values.get('name').strip()
	if not hat_regex.fullmatch(name):
		return error("Invalid name!")

	existing = g.db.query(HatDef.name).filter_by(name=name).one_or_none()
	if existing:
		return error("A hat with this name already exists!")

	description = request.values.get('description').strip()
	if not description_regex.fullmatch(description):
		return error("Invalid description!")

	author = request.values.get('author').strip()
	author = get_user(author)

	highquality = f'/asset_submissions/hats/{name}.png'
	file.save(highquality)

	i = Image.open(highquality)
	if i.width > 100 or i.height > 130:
		return error("Images must be 100x130")

	filename = f'/asset_submissions/hats/{name}.webp'
	copyfile(highquality, filename)
	process_image(filename)

	hat = HatDef(name=name, author_id=author.id, description=description, price=500, submitter_id=v.id)
	g.db.add(hat)

	g.db.commit()

	if v.admin_level > 2: hats = g.db.query(HatDef).filter(HatDef.submitter_id != None).all()
	else: hats = g.db.query(HatDef).filter(HatDef.submitter_id == v.id).all()
	return render_template("submit_hats.html", v=v, hats=hats, msg=f"'{name}' submitted successfully!")


@app.post("/admin/approve/hat/<name>")
@admin_level_required(3)
def approve_hat(v, name):
	if CARP_ID and v.id != CARP_ID:
		return {"error": "Only Carp can approve hats!"}, 403

	name = name.strip()

	hat = g.db.query(HatDef).filter_by(name=name).one_or_none()
	if not hat:
		return {"error": f"This hat '{name}' doesn't exist!"}, 404

	description = request.values.get('description').strip()
	if not description:
		return {"error": "You need to include description!"}, 400

	new_name = request.values.get('name').strip()
	if not new_name:
		return {"error": "You need to include name!"}, 400

	if not hat_regex.fullmatch(new_name):
		return {"error": "Invalid name!"}, 400

	if not description_regex.fullmatch(description):
		return {"error": "Invalid description!"}, 400

	hat.name = new_name
	hat.description = description
	g.db.add(hat)

	move(f"/asset_submissions/hats/{name}.webp", f"files/assets/images/hats/{hat.name}.webp")


	g.db.flush()
	author = hat.author

	all_by_author = g.db.query(HatDef).filter_by(author_id=author.id).count()

	if all_by_author >= 250:
		badge_grant(badge_id=166, user=author)
	elif all_by_author >= 100:
		badge_grant(badge_id=165, user=author)
	elif all_by_author >= 50:
		badge_grant(badge_id=164, user=author)
	elif all_by_author >= 10:
		badge_grant(badge_id=163, user=author)

	hat_copy = Hat(
		user_id=author.id,
		hat_id=hat.id
	)
	g.db.add(hat_copy)



	if v.id != hat.submitter_id:
		msg = f"@{v.username} has approved a hat you submitted: '{hat.name}'"
		send_repeatable_notification(hat.submitter_id, msg)

	hat.submitter_id = None

	return {"message": f"'{hat.name}' approved!"}

@app.post("/admin/reject/hat/<name>")
@admin_level_required(3)
def reject_hat(v, name):
	if CARP_ID and v.id != CARP_ID:
		return {"error": "Only Carp can reject hats!"}, 403

	name = name.strip()

	hat = g.db.query(HatDef).filter_by(name=name).one_or_none()
	if not hat:
		return {"error": f"This hat '{name}' doesn't exist!"}, 404

	if v.id != hat.submitter_id:
		msg = f"@{v.username} has rejected a hat you submitted: `'{hat.name}'`"
		send_repeatable_notification(hat.submitter_id, msg)

	g.db.delete(hat)
	os.remove(f"/asset_submissions/hats/{hat.name}.webp")

	return {"message": f"'{hat.name}' rejected!"}