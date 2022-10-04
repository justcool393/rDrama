import time
import gevent
import requests
from files.helpers.wrappers import *
from files.helpers.sanitize import *
from files.helpers.alerts import *
from files.helpers.discord import *
from files.helpers.const import *
from files.helpers.regex import *
from files.helpers.slots import *
from files.helpers.get import *
from files.helpers.actions import *
from files.helpers.sorting_and_time import *
from files.classes import *
from flask import *
from io import BytesIO
from files.__main__ import app, limiter, cache, db_session
from PIL import Image as PILimage
from .front import frontlist
from urllib.parse import ParseResult, urlunparse, urlparse, quote, unquote
from os import path
import requests
from shutil import copyfile
from sys import stdout
import os


titleheaders = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Safari/537.36"}


@app.post("/toggle_club/<pid>")
@auth_required
def toggle_club(pid, v):
	if not FEATURES['COUNTRY_CLUB']:
		abort(403)

	post = get_post(pid)
	if post.author_id != v.id and v.admin_level < 2: abort(403)

	post.club = not post.club
	g.db.add(post)


	if post.club: return {"message": "Post has been marked as club-only!"}
	else: return {"message": "Post has been unmarked as club-only!"}


@app.post("/publish/<pid>")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
@limiter.limit("1/second;30/minute;200/hour;1000/day", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def publish(pid, v):
	post = get_post(pid)
	if not post.private: return {"message": "Post published!"}

	if post.author_id != v.id: abort(403)
	post.private = False
	post.created_utc = int(time.time())
	g.db.add(post)
	
	if not post.ghost:
		notify_users = NOTIFY_USERS(f'{post.title} {post.body}', v)

		if notify_users:
			cid = notif_comment2(post)
			for x in notify_users:
				add_notif(cid, x)


	cache.delete_memoized(frontlist)
	cache.delete_memoized(User.userpagelisting)

	if (v.admin_level > 0 or v.has_badge(3)) and post.sub == 'changelog':
		send_changelog_message(post.permalink)

	if SITE == 'watchpeopledie.co':
		send_wpd_message(post.permalink)

	execute_snappy(post, v)

	if is_site_url(request.referrer):
		return redirect(request.referrer)

	return redirect(post.permalink)

@app.get("/submit")
@app.get("/h/<sub>/submit")
@auth_required
def submit_get(v, sub=None):
	if sub: sub = g.db.get(Sub, sub.strip().lower())
	
	if request.path.startswith('/h/') and not sub: abort(404)

	SUBS = [x[0] for x in g.db.query(Sub.name).order_by(Sub.name).all()]

	return render_template("submit.html", SUBS=SUBS, v=v, sub=sub)

@app.get("/post/<pid>")
@app.get("/post/<pid>/<anything>")
@app.get("/h/<sub>/post/<pid>")
@app.get("/h/<sub>/post/<pid>/<anything>")
@app.get("/logged_out/post/<pid>")
@app.get("/logged_out/post/<pid>/<anything>")
@app.get("/logged_out/h/<sub>/post/<pid>")
@app.get("/logged_out/h/<sub>/post/<pid>/<anything>")
@auth_desired_with_logingate
def post_id(pid, anything=None, v=None, sub=None):
	post = get_post(pid, v=v)
	if not post.can_see(v): abort(403)

	if post.over_18 and not (v and v.over_18) and session.get('over_18', 0) < int(time.time()):
		if request.headers.get("Authorization") or request.headers.get("xhr"): return {"error":"Must be 18+ to view"}, 451
		return render_template("errors/nsfw.html", v=v)

	if post.new or 'megathread' in post.title.lower(): defaultsortingcomments = 'new'
	elif v: defaultsortingcomments = v.defaultsortingcomments
	else: defaultsortingcomments = "top"
	sort = request.values.get("sort", defaultsortingcomments)

	if post.club and not (v and (v.paid_dues or v.id == post.author_id)): abort(403)

	if v:
		votes = g.db.query(CommentVote.vote_type, CommentVote.comment_id).filter_by(user_id=v.id).subquery()

		blocking = v.blocking.subquery()

		blocked = v.blocked.subquery()

		comments = g.db.query(
			Comment,
			votes.c.vote_type,
			blocking.c.target_id,
			blocked.c.target_id,
		)
		
		if not (v and v.shadowbanned) and not (v and v.admin_level >= 2):
			comments = comments.join(Comment.author).filter(User.shadowbanned == None)
 
		comments=comments.filter(Comment.parent_submission == post.id, Comment.level < 10).join(
			votes,
			votes.c.comment_id == Comment.id,
			isouter=True
		).join(
			blocking,
			blocking.c.target_id == Comment.author_id,
			isouter=True
		).join(
			blocked,
			blocked.c.user_id == Comment.author_id,
			isouter=True
		)

		output = []
		for c in comments.all():
			comment = c[0]
			comment.voted = c[1] or 0
			comment.is_blocking = c[2] or 0
			comment.is_blocked = c[3] or 0
			output.append(comment)

		pinned = [c[0] for c in comments.filter(Comment.stickied != None).all()]

		comments = comments.filter(Comment.level == 1, Comment.stickied == None)

		comments = sort_comments(sort, comments)

		comments = [c[0] for c in comments.all()]
	else:
		pinned = g.db.query(Comment).filter(Comment.parent_submission == post.id, Comment.stickied != None).all()

		comments = g.db.query(Comment).join(Comment.author).filter(User.shadowbanned == None, Comment.parent_submission == post.id, Comment.level == 1, Comment.stickied == None)

		comments = sort_comments(sort, comments)

		comments = comments.all()

	offset = 0
	ids = set()

	if v and v.poorcel: threshold = 50
	else: threshold = 100

	if post.comment_count > threshold+25 and not request.headers.get("Authorization") and not request.values.get("all"):
		comments2 = []
		count = 0
		if post.created_utc > 1638672040:
			for comment in comments:
				comments2.append(comment)
				ids.add(comment.id)
				count += g.db.query(Comment).filter_by(parent_submission=post.id, top_comment_id=comment.id).count() + 1
				if count > threshold: break
		else:
			for comment in comments:
				comments2.append(comment)
				ids.add(comment.id)
				count += g.db.query(Comment).filter_by(parent_submission=post.id, parent_comment_id=comment.id).count() + 1
				if count > 20: break

		if len(comments) == len(comments2): offset = 0
		else: offset = 1
		comments = comments2

	for pin in pinned:
		if pin.stickied_utc and int(time.time()) > pin.stickied_utc:
			pin.stickied = None
			pin.stickied_utc = None
			g.db.add(pin)
			pinned.remove(pin)
		elif pin.level > 1:
			pinned.remove(pin)
			if pin.top_comment not in pinned:
				pinned.append(pin.top_comment)
			if pin.top_comment in comments:
				comments.remove(pin.top_comment) 

	post.replies = pinned + comments

	post.views += 1
	g.db.add(post)

	if request.headers.get("Authorization"):
		return post.json

	template = "submission.html"
	if (post.is_banned or post.author.shadowbanned) \
			and not (v and (v.admin_level >= 2 or post.author_id == v.id)):
		template = "submission_banned.html"

	return render_template(template, v=v, p=post, ids=list(ids),
		sort=sort, render_replies=True, offset=offset, sub=post.subr,
		fart=app.config['SETTINGS']['Fart mode'])

@app.get("/viewmore/<pid>/<sort>/<offset>")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
@auth_desired_with_logingate
def viewmore(v, pid, sort, offset):
	post = get_post(pid, v=v)
	if post.club and not (v and (v.paid_dues or v.id == post.author_id)): abort(403)

	offset = int(offset)
	try: ids = set(int(x) for x in request.values.get("ids").split(','))
	except: abort(400)
	
	if v:
		votes = g.db.query(CommentVote.vote_type, CommentVote.comment_id).filter_by(user_id=v.id).subquery()

		blocking = v.blocking.subquery()

		blocked = v.blocked.subquery()

		comments = g.db.query(
			Comment,
			votes.c.vote_type,
			blocking.c.target_id,
			blocked.c.target_id,
		).filter(Comment.parent_submission == pid, Comment.stickied == None, Comment.id.notin_(ids), Comment.level < 10)
		
		if not (v and v.shadowbanned) and not (v and v.admin_level >= 2):
			comments = comments.join(Comment.author).filter(User.shadowbanned == None)
 
		comments=comments.join(
			votes,
			votes.c.comment_id == Comment.id,
			isouter=True
		).join(
			blocking,
			blocking.c.target_id == Comment.author_id,
			isouter=True
		).join(
			blocked,
			blocked.c.user_id == Comment.author_id,
			isouter=True
		)

		output = []
		for c in comments.all():
			comment = c[0]
			comment.voted = c[1] or 0
			comment.is_blocking = c[2] or 0
			comment.is_blocked = c[3] or 0
			output.append(comment)
		
		comments = comments.filter(Comment.level == 1)

		comments = sort_comments(sort, comments)

		comments = [c[0] for c in comments.all()]
	else:
		comments = g.db.query(Comment).join(Comment.author).filter(User.shadowbanned == None, Comment.parent_submission == pid, Comment.level == 1, Comment.stickied == None, Comment.id.notin_(ids))

		comments = sort_comments(sort, comments)
		
		comments = comments.offset(offset).all()

	comments2 = []
	count = 0
	if post.created_utc > 1638672040:
		for comment in comments:
			comments2.append(comment)
			ids.add(comment.id)
			count += g.db.query(Comment).filter_by(parent_submission=post.id, top_comment_id=comment.id).count() + 1
			if count > 100: break
	else:
		for comment in comments:
			comments2.append(comment)
			ids.add(comment.id)
			count += g.db.query(Comment).filter_by(parent_submission=post.id, parent_comment_id=comment.id).count() + 1
			if count > 20: break
	
	if len(comments) == len(comments2): offset = 0
	else: offset += 1
	comments = comments2

	return render_template("comments.html", v=v, comments=comments, p=post, ids=list(ids), render_replies=True, pid=pid, sort=sort, offset=offset)


@app.get("/morecomments/<cid>")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
@auth_desired_with_logingate
def morecomments(v, cid):
	try: cid = int(cid)
	except: abort(400)

	tcid = g.db.query(Comment.top_comment_id).filter_by(id=cid).one_or_none()[0]

	if v:
		votes = g.db.query(CommentVote.vote_type, CommentVote.comment_id).filter_by(user_id=v.id).subquery()

		blocking = v.blocking.subquery()

		blocked = v.blocked.subquery()

		comments = g.db.query(
			Comment,
			votes.c.vote_type,
			blocking.c.target_id,
			blocked.c.target_id,
		).filter(Comment.top_comment_id == tcid, Comment.level > 9).join(
			votes,
			votes.c.comment_id == Comment.id,
			isouter=True
		).join(
			blocking,
			blocking.c.target_id == Comment.author_id,
			isouter=True
		).join(
			blocked,
			blocked.c.user_id == Comment.author_id,
			isouter=True
		)

		output = []
		dump = []
		for c in comments.all():
			comment = c[0]
			comment.voted = c[1] or 0
			comment.is_blocking = c[2] or 0
			comment.is_blocked = c[3] or 0
			if c[0].parent_comment_id == int(cid): output.append(comment)
			else: dump.append(comment)
		comments = output
	else:
		c = get_comment(cid)
		comments = c.replies(None)

	if comments: p = comments[0].post
	else: p = None
	
	return render_template("comments.html", v=v, comments=comments, p=p, render_replies=True)

@app.post("/edit_post/<pid>")
@limiter.limit("1/second;10/minute;100/hour;200/day")
@limiter.limit("1/second;10/minute;100/hour;200/day", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def edit_post(pid, v):
	p = get_post(pid)

	title = request.values.get("title", "").strip().replace('‎','')

	body = request.values.get("body", "").strip().replace('‎','')

	body = body.replace('\r\n', '\n')[:20000]

	if v.id != p.author_id and v.admin_level < 2:
		abort(403)

	if v.id == p.author_id:
		if v.longpost and (len(body) < 280 or ' [](' in body or body.startswith('[](')):
			return {"error":"You have to type more than 280 characters!"}, 403
		elif v.bird and len(body) > 140:
			return {"error":"You have to type less than 140 characters!"}, 403

	if title != p.title:
		torture = (v.agendaposter and not v.marseyawarded and p.sub != 'chudrama' and v.id == p.author_id)

		title_html = filter_emojis_only(title, golden=False, torture=torture)

		if v.id == p.author_id and v.marseyawarded and not marseyaward_title_regex.fullmatch(title_html):
			return {"error":"You can only type marseys!"}, 403

		p.title = title[:500]
		p.title_html = title_html

	body += process_files()

	body = body.strip()

	if body != p.body:
		for i in poll_regex.finditer(body):
			body = body.replace(i.group(0), "")
			option = SubmissionOption(
				submission_id=p.id,
				body_html=filter_emojis_only(i.group(1)),
				exclusive = 0
			)
			g.db.add(option)

		for i in choice_regex.finditer(body):
			body = body.replace(i.group(0), "")
			option = SubmissionOption(
				submission_id=p.id,
				body_html=filter_emojis_only(i.group(1)),
				exclusive = 1
			)
			g.db.add(option)


		torture = (v.agendaposter and not v.marseyawarded and p.sub != 'chudrama' and v.id == p.author_id)

		body_html = sanitize(body, golden=False, limit_pings=100, showmore=False, torture=torture)

		if v.id == p.author_id and v.marseyawarded and marseyaward_body_regex.search(body_html):
			return {"error":"You can only type marseys!"}, 403


		p.body = body

		if blackjack and any(i in f'{p.body} {p.title} {p.url}'.lower() for i in blackjack.split()):
			v.shadowbanned = 'AutoJanny'
			if not v.is_banned: v.ban_reason = 'Blackjack'
			g.db.add(v)
			send_repeatable_notification(CARP_ID, p.permalink)

		if len(body_html) > 40000: return {"error":"Submission body_html too long! (max 40k characters)"}, 400

		p.body_html = body_html

		if v.id == p.author_id and v.agendaposter and not v.marseyawarded and AGENDAPOSTER_PHRASE not in f'{p.body}{p.title}'.lower() and p.sub != 'chudrama':
			return {"error": f'You have to include "{AGENDAPOSTER_PHRASE}" in your post!'}, 403


	if not p.private and not p.ghost:
		notify_users = NOTIFY_USERS(f'{p.title} {p.body}', v)
		if notify_users:
			cid = notif_comment2(p)
			for x in notify_users:
				add_notif(cid, x)

	if v.id == p.author_id:
		if int(time.time()) - p.created_utc > 60 * 3: p.edited_utc = int(time.time())
		g.db.add(p)
	else:
		ma=ModAction(
			kind="edit_post",
			user_id=v.id,
			target_submission_id=p.id
		)
		g.db.add(ma)


	return redirect(p.permalink)


def thumbnail_thread(pid):

	db = db_session()

	def expand_url(post_url, fragment_url):

		if fragment_url.startswith("https://"):
			return fragment_url
		elif fragment_url.startswith("https://"):
			return f"https://{fragment_url.split('https://')[1]}"
		elif fragment_url.startswith('//'):
			return f"https:{fragment_url}"
		elif fragment_url.startswith('/') and '\\' not in fragment_url:
			parsed_url = urlparse(post_url)
			return f"https://{parsed_url.netloc}{fragment_url}"
		else:
			return f"{post_url}/{fragment_url}"

	post = db.get(Submission, pid)
	
	if not post or not post.url:
		time.sleep(5)
		post = db.get(Submission, pid)

	if not post or not post.url: return
	
	fetch_url = post.url

	if fetch_url.startswith('/') and '\\' not in fetch_url:
		fetch_url = f"{SITE_FULL}{fetch_url}"

	headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.72 Safari/537.36"}

	try:
		x=requests.get(fetch_url, headers=headers, timeout=5, proxies=proxies)
	except:
		db.close()
		return

	if x.status_code != 200:
		db.close()
		return
	


	if x.headers.get("Content-Type","").startswith("text/html"):
		soup=BeautifulSoup(x.content, 'lxml')

		thumb_candidate_urls=[]

		meta_tags = [
			"drama:thumbnail",
			"twitter:image",
			"og:image",
			"thumbnail"
			]

		for tag_name in meta_tags:
			

			tag = soup.find(
				'meta', 
				attrs={
					"name": tag_name, 
					"content": True
					}
				)
			if not tag:
				tag = soup.find(
					'meta',
					attrs={
						'property': tag_name,
						'content': True
						}
					)
			if tag:
				thumb_candidate_urls.append(expand_url(post.url, tag['content']))

		for tag in soup.find_all("img", attrs={'src':True}):
			thumb_candidate_urls.append(expand_url(post.url, tag['src']))


		for url in thumb_candidate_urls:

			try:
				image_req=requests.get(url, headers=headers, timeout=5, proxies=proxies)
			except:
				continue

			if image_req.status_code >= 400:
				continue

			if not image_req.headers.get("Content-Type","").startswith("image/"):
				continue

			if image_req.headers.get("Content-Type","").startswith("image/svg"):
				continue

			image = PILimage.open(BytesIO(image_req.content))
			if image.width < 30 or image.height < 30:
				continue

			break

		else:
			db.close()
			return



	elif x.headers.get("Content-Type","").startswith("image/"):
		image_req=x
		image = PILimage.open(BytesIO(x.content))

	else:
		db.close()
		return

	size = len(image.fp.read())
	if size > 8 * 1024 * 1024:
		db.close()
		return

	name = f'/images/{time.time()}'.replace('.','') + '.webp'

	with open(name, "wb") as file:
		for chunk in image_req.iter_content(1024):
			file.write(chunk)

	post.thumburl = process_image(name, resize=100)
	db.add(post)
	db.commit()
	db.close()
	stdout.flush()
	return


@app.post("/is_repost")
def is_repost():
	if not FEATURES['REPOST_DETECTION']:
		return {'permalink': ''}

	url = request.values.get('url')
	if not url: abort(400)

	url = normalize_url(url)
	parsed_url = urlparse(url)

	domain = parsed_url.netloc
	if domain in ('old.reddit.com','twitter.com','instagram.com','tiktok.com') and '/search' not in url:
		new_url = ParseResult(scheme="https",
				netloc=parsed_url.netloc,
				path=parsed_url.path,
				params=parsed_url.params,
				query=None,
				fragment=parsed_url.fragment)
	else:
		qd = parse_qs(parsed_url.query, keep_blank_values=True)
		filtered = {k: val for k, val in qd.items() if not k.startswith('utm_') and not k.startswith('ref_')}

		new_url = ParseResult(scheme="https",
							netloc=parsed_url.netloc,
							path=parsed_url.path,
							params=parsed_url.params,
							query=urlencode(filtered, doseq=True),
							fragment=parsed_url.fragment)
	
	url = urlunparse(new_url)

	url = url.rstrip('/')

	search_url = url.replace('%', '').replace('\\', '').replace('_', '\_').strip()
	repost = g.db.query(Submission).filter(
		Submission.url.ilike(search_url),
		Submission.deleted_utc == 0,
		Submission.is_banned == False
	).first()
	if repost: return {'permalink': repost.permalink}
	else: return {'permalink': ''}

@app.post("/submit")
@app.post("/h/<sub>/submit")
@limiter.limit(POST_RATE_LIMIT)
@limiter.limit(POST_RATE_LIMIT, key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def submit_post(v, sub=None):

	url = request.values.get("url", "").strip()

	if '\\' in url: abort(400)

	title = request.values.get("title", "").strip()[:500].replace('‎','')
	
	body = request.values.get("body", "").strip().replace('‎','')

	body = body.replace('\r\n', '\n')[:20000]

	def error(error):
		if request.headers.get("Authorization") or request.headers.get("xhr"): return {"error": error}, 403
	
		SUBS = [x[0] for x in g.db.query(Sub.name).order_by(Sub.name).all()]
		return render_template("submit.html", SUBS=SUBS, v=v, error=error, title=title, url=url, body=body), 400


	sub = request.values.get("sub", "").lower().replace('/h/','').strip()

	if sub == 'changelog':
		allowed = g.db.query(User.id).filter(User.admin_level > 0).all() + g.db.query(Badge.user_id).filter_by(badge_id=3).all()
		allowed = [x[0] for x in allowed]
		if v.id not in allowed: return error(f"You don't have sufficient permissions to post in /h/changelog")

	if sub in ('furry','vampire','racist','femboy') and not v.client and not v.house.lower().startswith(sub):
		return error(f"You need to be a member of House {sub.capitalize()} to post in /h/{sub}")

	if sub and sub != 'none':
		sname = sub.strip().lower()
		sub = g.db.query(Sub.name).filter_by(name=sname).one_or_none()
		if not sub: return error(f"/h/{sname} not found!")
		sub = sub[0]
		if v.exiled_from(sub): return error(f"You're exiled from /h/{sub}")
	else: sub = None

	if not sub and HOLE_REQUIRED:
		return error(f"You must choose a {HOLE_NAME} for your post!")

	if v.is_suspended: return error("You can't perform this action while banned.")
	
	torture = (v.agendaposter and not v.marseyawarded and sub != 'chudrama')

	title_html = filter_emojis_only(title, graceful=True, count_marseys=True, torture=torture)

	if v.marseyawarded and not marseyaward_title_regex.fullmatch(title_html):
		return error("You can only type marseys!")

	if len(title_html) > 1500: return error("Rendered title is too big!")

	if v.longpost and (len(body) < 280 or ' [](' in body or body.startswith('[](')):
		return error("You have to type more than 280 characters!")
	elif v.bird and len(body) > 140:
		return error("You have to type less than 140 characters!")


	embed = None

	if url:
		url = normalize_url(url)
		parsed_url = urlparse(url)

		domain = parsed_url.netloc
		if domain in ('old.reddit.com','twitter.com','instagram.com','tiktok.com') and '/search' not in url:
			new_url = ParseResult(scheme="https",
					netloc=parsed_url.netloc,
					path=parsed_url.path,
					params=parsed_url.params,
					query=None,
					fragment=parsed_url.fragment)
		else:
			qd = parse_qs(parsed_url.query, keep_blank_values=True)
			filtered = {k: val for k, val in qd.items() if not k.startswith('utm_') and not k.startswith('ref_')}

			new_url = ParseResult(scheme="https",
								netloc=parsed_url.netloc,
								path=parsed_url.path,
								params=parsed_url.params,
								query=urlencode(filtered, doseq=True),
								fragment=parsed_url.fragment)
		
		url = urlunparse(new_url)

		url = url.rstrip('/')

		search_url = url.replace('%', '').replace('\\', '').replace('_', '\_').strip()
		repost = g.db.query(Submission).filter(
			Submission.url.ilike(search_url),
			Submission.deleted_utc == 0,
			Submission.is_banned == False
		).first()
		if repost and FEATURES['REPOST_DETECTION']:
			return redirect(repost.permalink)

		domain_obj = get_domain(domain)
		if not domain_obj: domain_obj = get_domain(domain+parsed_url.path)

		if domain_obj:
			reason = f"Remove the {domain_obj.domain} link from your post and try again. {domain_obj.reason}"
			return error(reason)
		elif "twitter.com" == domain:
			try:
				embed = requests.get("https://publish.twitter.com/oembed", params={"url":url, "omit_script":"t"}, timeout=5).json()["html"]
				embed = embed.replace('<a href', '<a rel="nofollow noopener noreferrer" href')
			except: pass
		elif url.startswith('https://youtube.com/watch?v='):
			url = unquote(url).replace('?t', '&t')
			yt_id = url.split('https://youtube.com/watch?v=')[1].split('&')[0].split('%')[0]

			if yt_id_regex.fullmatch(yt_id):
				req = requests.get(f"https://www.googleapis.com/youtube/v3/videos?id={yt_id}&key={YOUTUBE_KEY}&part=contentDetails", timeout=5).json()
				if req.get('items'):
					params = parse_qs(urlparse(url).query, keep_blank_values=True)
					t = params.get('t', params.get('start', [0]))[0]
					if isinstance(t, str): t = t.replace('s','')

					embed = f'<lite-youtube videoid="{yt_id}" params="autoplay=1&modestbranding=1'
					if t:
						try: embed += f'&start={int(t)}'
						except: pass
					embed += '"></lite-youtube>'
			
		elif SITE in domain and "/post/" in url and "context" not in url and url.count('/') < 6:
			id = url.split("/post/")[1]
			if "/" in id: id = id.split("/")[0]
			embed = str(int(id))


	if not url and not request.values.get("body") and not request.files.get("file") and not request.files.get("file-url"):
		return error("Please enter a url or some text.")

	if not title:
		return error("Please enter a better title.")


	elif len(title) > 500:
		return error("There's a 500 character limit for titles.")

	dup = g.db.query(Submission).filter(
		Submission.author_id == v.id,
		Submission.deleted_utc == 0,
		Submission.title == title,
		Submission.url == url,
		Submission.body == body
	).one_or_none()

	if dup and SITE != 'localhost': return redirect(dup.permalink)

	now = int(time.time())
	cutoff = now - 60 * 60 * 24


	similar_posts = g.db.query(Submission).filter(
					Submission.author_id == v.id,
					Submission.title.op('<->')(title) < SPAM_SIMILARITY_THRESHOLD,
					Submission.created_utc > cutoff
	).all()

	if url:
		similar_urls = g.db.query(Submission).filter(
					Submission.author_id == v.id,
					Submission.url.op('<->')(url) < SPAM_URL_SIMILARITY_THRESHOLD,
					Submission.created_utc > cutoff
		).all()
	else: similar_urls = []

	threshold = SPAM_SIMILAR_COUNT_THRESHOLD
	if v.age >= (60 * 60 * 24 * 7): threshold *= 3
	elif v.age >= (60 * 60 * 24): threshold *= 2

	if max(len(similar_urls), len(similar_posts)) >= threshold:

		text = "Your account has been banned for **1 day** for the following reason:\n\n> Too much spam!"
		send_repeatable_notification(v.id, text)

		v.ban(reason="Spamming.",
			  days=1)

		for post in similar_posts + similar_urls:
			post.is_banned = True
			post.is_pinned = False
			post.ban_reason = "AutoJanny"
			g.db.add(post)
			ma=ModAction(
					user_id=AUTOJANNY_ID,
					target_submission_id=post.id,
					kind="ban_post",
					_note="spam"
					)
			g.db.add(ma)
		return redirect("/notifications")

	if len(url) > 2048:
		return error("There's a 2048 character limit for URLs.")

	if v and v.admin_level > 2:
		bets = []
		for i in bet_regex.finditer(body):
			bets.append(i.group(1))
			body = body.replace(i.group(0), "")

	options = []
	for i in poll_regex.finditer(body):
		options.append(i.group(1))
		body = body.replace(i.group(0), "")

	choices = []
	for i in choice_regex.finditer(body):
		choices.append(i.group(1))
		body = body.replace(i.group(0), "")

	body += process_files()

	body = body.strip()

	torture = (v.agendaposter and not v.marseyawarded and sub != 'chudrama')

	body_html = sanitize(body, count_marseys=True, limit_pings=100, showmore=False, torture=torture)

	if v.marseyawarded and marseyaward_body_regex.search(body_html):
		return error("You can only type marseys!")

	if len(body_html) > 40000: return error("Submission body_html too long! (max 40k characters)")

	club = False
	if FEATURES['COUNTRY_CLUB']:
		club = bool(request.values.get("club",""))
	
	if embed and len(embed) > 1500: embed = None

	is_bot = v.id != 12125 and bool(request.headers.get("Authorization")) or (SITE == 'pcmemes.net' and v.id == SNAPPY_ID)

	if request.values.get("ghost") and v.coins >= 100:
		v.coins -= 100
		ghost = True
	else: ghost = False

	if embed: embed = embed.strip()

	post = Submission(
		private=bool(request.values.get("private","")),
		notify=bool(request.values.get("notify","")),
		club=club,
		author_id=v.id,
		over_18=bool(request.values.get("over_18","")),
		new=bool(request.values.get("new","")),
		app_id=v.client.application.id if v.client else None,
		is_bot = is_bot,
		url=url,
		body=body[:20000],
		body_html=body_html,
		embed_url=embed,
		title=title[:500],
		title_html=title_html,
		sub=sub,
		ghost=ghost
	)

	g.db.add(post)
	g.db.flush()

	if blackjack and any(i in f'{post.body} {post.title} {post.url}'.lower() for i in blackjack.split()):
		v.shadowbanned = 'AutoJanny'
		if not v.is_banned: v.ban_reason = 'Blackjack'
		g.db.add(v)
		send_repeatable_notification(CARP_ID, post.permalink)

	for option in options:
		option = SubmissionOption(
			submission_id=post.id,
			body_html=filter_emojis_only(option),
			exclusive=0
		)
		g.db.add(option)

	for choice in choices:
		choice = SubmissionOption(
			submission_id=post.id,
			body_html=filter_emojis_only(choice),
			exclusive=1
		)
		g.db.add(choice)

	if v and v.admin_level > 2:
		for bet in bets:
			bet = SubmissionOption(
				submission_id=post.id,
				body_html=filter_emojis_only(bet),
				exclusive=2
			)
			g.db.add(bet)

	vote = Vote(user_id=v.id,
				vote_type=1,
				submission_id=post.id
				)
	g.db.add(vote)
	
	if request.files.get('file-url') and request.headers.get("cf-ipcountry") != "T1":

		file = request.files['file-url']

		if file.content_type.startswith('image/'):
			name = f'/images/{time.time()}'.replace('.','') + '.webp'
			file.save(name)
			post.url = process_image(name)

			name2 = name.replace('.webp', 'r.webp')
			copyfile(name, name2)
			post.thumburl = process_image(name2, resize=100)
		elif file.content_type.startswith('video/'):
			post.url = process_video(file)
		elif file.content_type.startswith('audio/'):
			post.url = process_audio(file)
		else:
			abort(415)
		
	if not post.thumburl and post.url:
		gevent.spawn(thumbnail_thread, post.id)




	if not post.private and not post.ghost:

		notify_users = NOTIFY_USERS(f'{title} {body}', v)

		if notify_users:
			cid = notif_comment2(post)
			for x in notify_users:
				add_notif(cid, x)

	if v.agendaposter and not v.marseyawarded and AGENDAPOSTER_PHRASE not in f'{post.body}{post.title}'.lower() and sub != 'chudrama':
		post.is_banned = True
		post.ban_reason = "AutoJanny"

		body = AGENDAPOSTER_MSG.format(username=v.username, type='post', AGENDAPOSTER_PHRASE=AGENDAPOSTER_PHRASE)

		body_jannied_html = AGENDAPOSTER_MSG_HTML.format(id=v.id, username=v.username, type='post', AGENDAPOSTER_PHRASE=AGENDAPOSTER_PHRASE)


		c_jannied = Comment(author_id=AUTOJANNY_ID,
			parent_submission=post.id,
			level=1,
			over_18=False,
			is_bot=True,
			app_id=None,
			stickied='AutoJanny',
			distinguish_level=6,
			body=body,
			body_html=body_jannied_html,
			ghost=post.ghost
		)

		g.db.add(c_jannied)
		g.db.flush()

		c_jannied.top_comment_id = c_jannied.id

		n = Notification(comment_id=c_jannied.id, user_id=v.id)
		g.db.add(n)



	if not post.private and not (post.sub and g.db.query(Exile.user_id).filter_by(user_id=SNAPPY_ID, sub=post.sub).one_or_none()):
		execute_snappy(post, v)




	v.post_count = g.db.query(Submission).filter_by(author_id=v.id, deleted_utc=0).count()
	g.db.add(v)

	if v.id == PIZZASHILL_ID:
		for uid in PIZZA_VOTERS:
			autovote = Vote(user_id=uid, submission_id=post.id, vote_type=1)
			autovote.created_utc += 1
			g.db.add(autovote)
		v.coins += 3
		v.truecoins += 3
		g.db.add(v)
		post.upvotes += 3
		g.db.add(post)

	cache.delete_memoized(frontlist)
	cache.delete_memoized(User.userpagelisting)

	if (v.admin_level > 0 or v.has_badge(3)) and post.sub == 'changelog' and not post.private:
		send_changelog_message(post.permalink)

	if not post.private and SITE == 'watchpeopledie.co':
		send_wpd_message(post.permalink)

	g.db.commit()
	if request.headers.get("Authorization"): return post.json
	else:
		post.voted = 1
		if post.new or 'megathread' in post.title.lower(): sort = 'new'
		else: sort = v.defaultsortingcomments
		return render_template('submission.html', v=v, p=post, sort=sort, render_replies=True, offset=0, success=True, sub=post.subr)


@app.post("/delete_post/<pid>")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
@limiter.limit("1/second;30/minute;200/hour;1000/day", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def delete_post_pid(pid, v):
	post = get_post(pid)
	if post.author_id != v.id: abort(403)

	if not post.deleted_utc:
		post.deleted_utc = int(time.time())
		post.is_pinned = False
		post.stickied = None

		g.db.add(post)

		cache.delete_memoized(frontlist)
		cache.delete_memoized(User.userpagelisting)

		g.db.flush()
		v.post_count = g.db.query(Submission).filter_by(author_id=v.id, deleted_utc=0).count()
		g.db.add(v)

	return {"message": "Post deleted!"}

@app.post("/undelete_post/<pid>")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
@limiter.limit("1/second;30/minute;200/hour;1000/day", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def undelete_post_pid(pid, v):
	post = get_post(pid)
	if post.author_id != v.id: abort(403)

	if post.deleted_utc:
		post.deleted_utc = 0
		g.db.add(post)

		cache.delete_memoized(frontlist)
		cache.delete_memoized(User.userpagelisting)

		g.db.flush()
		v.post_count = g.db.query(Submission).filter_by(author_id=v.id, deleted_utc=0).count()
		g.db.add(v)

	return {"message": "Post undeleted!"}


@app.post("/toggle_comment_nsfw/<cid>")
@auth_required
def toggle_comment_nsfw(cid, v):
	comment = get_comment(cid)

	if comment.author_id != v.id and not v.admin_level > 1:
		abort(403)

	comment.over_18 = not comment.over_18
	g.db.add(comment)

	if comment.author_id != v.id:
		if v.admin_level >= 2:
			ma = ModAction(
				kind = "set_nsfw" if comment.over_18 else "unset_nsfw",
				user_id = v.id,
				target_submission_id = comment.id,
				)
			g.db.add(ma)
		g.db.add(ma)

	if comment.over_18: return {"message": "Comment has been marked as +18!"}
	else: return {"message": "Comment has been unmarked as +18!"}
	
@app.post("/toggle_post_nsfw/<pid>")
@auth_required
def toggle_post_nsfw(pid, v):
	post = get_post(pid)

	if post.author_id != v.id and not v.admin_level >= 2:
		abort(403)
	if post.hole and not v.mods(post.hole):
		abort(403)

	post.over_18 = not post.over_18
	g.db.add(post)

	if post.author_id != v.id:
		if v.admin_level >= 2:
			ma = ModAction(
				kind = "set_nsfw" if post.over_18 else "unset_nsfw",
				user_id = v.id,
				target_submission_id = post.id,
				)
			g.db.add(ma)
		elif post.hole:
			sa = SubAction(
				kind = "set_nsfw" if post.over_18 else "unset_nsfw",
				user_id = v.id,
				target_submission_id = post.id
			)
			g.db.add(sa)

	if post.over_18: return {"message": "Post has been marked as +18!"}
	else: return {"message": "Post has been unmarked as +18!"}

@app.post("/save_post/<pid>")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
@limiter.limit("1/second;30/minute;200/hour;1000/day", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def save_post(pid, v):

	post=get_post(pid)

	save = g.db.query(SaveRelationship).filter_by(user_id=v.id, submission_id=post.id).one_or_none()

	if not save:
		new_save=SaveRelationship(user_id=v.id, submission_id=post.id)
		g.db.add(new_save)

	return {"message": "Post saved!"}

@app.post("/unsave_post/<pid>")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
@limiter.limit("1/second;30/minute;200/hour;1000/day", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def unsave_post(pid, v):

	post=get_post(pid)

	save = g.db.query(SaveRelationship).filter_by(user_id=v.id, submission_id=post.id).one_or_none()

	if save:
		g.db.delete(save)

	return {"message": "Post unsaved!"}

@app.post("/pin/<post_id>")
@auth_required
def pin_post(post_id, v):

	post = get_post(post_id)
	if post:
		if v.id != post.author_id: return {"error": "Only the post author's can do that!"}, 400
		post.is_pinned = not post.is_pinned
		g.db.add(post)

		cache.delete_memoized(User.userpagelisting)

		if post.is_pinned: return {"message": "Post pinned!"}
		else: return {"message": "Post unpinned!"}
	return {"error": "Post not found!"}, 400


extensions = (
	'.webp','.jpg','.png','.jpeg','.gif','.gifv','.tif', '.tiff',
	'.mp4','.webm','.mov',
	'.mp3','.wav','.ogg','.aac','.m4a','.flac'
)

@app.get("/submit/title")
@limiter.limit("3/minute")
@limiter.limit("3/minute", key_func=lambda:f'{SITE}-{session.get("lo_user")}')
@auth_required
def get_post_title(v):

	url = request.values.get("url")
	if not url or '\\' in url: abort(400)

	checking_url = url.lower().rstrip('%3F').rstrip('?')
	if any((checking_url.endswith(x) for x in extensions)):
		abort(400)

	try: x = requests.get(url, headers=titleheaders, timeout=5, proxies=proxies)
	except: abort(400)
		
	content_type = x.headers.get("Content-Type")
	if not content_type or "text/html" not in content_type: abort(400)

	soup = BeautifulSoup(x.content, 'lxml')

	title = soup.find('title')
	if not title: abort(400)

	return {"url": url, "title": title.string}
