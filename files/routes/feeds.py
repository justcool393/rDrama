import html
from .front import frontlist
from datetime import datetime
from files.helpers.jinja2 import full_link
from files.helpers.get import *
from yattag import Doc
from files.helpers.wrappers import *

from files.__main__ import app

@app.get('/rss/<sort>/<t>')
@auth_required
def feeds_user(v=None, sort='hot', t='all'):

	page = int(request.values.get("page", 1))

	ids, next_exists = frontlist(
		sort=sort,
		page=page,
		t=t,
		v=None,
		)
	
	posts = get_posts(ids)

	domain = environ.get("DOMAIN").strip()

	doc, tag, text = Doc().tagtext()

	with tag("feed", ("xmlns:media","http://search.yahoo.com/mrss/"), xmlns="http://www.w3.org/2005/Atom",):
		with tag("title", type="text"):
			text(f"{sort} posts from {domain}")

		doc.stag("link", href=request.url)
		doc.stag("link", href=request.url_root)

		for post in posts:
			with tag("entry", ("xml:base", request.url)):
				with tag("title", type="text"):
					text(post.realtitle(None))

				with tag("id"):
					text(post.fullname)

				if (post.edited_utc > 0):
					with tag("updated"):
						text(datetime.utcfromtimestamp(post.edited_utc).isoformat())

				with tag("published"):
					text(datetime.utcfromtimestamp(post.created_utc).isoformat())
				
				with tag("author"):
					with tag("name"):
						text(post.author.username)
					with tag("uri"):
						text(f'https://{site}/@{post.author.username}')

				doc.stag("link", href=full_link(post.permalink))

				image_url = post.thumb_url or post.embed_url or post.url

				doc.stag("media:thumbnail", url=image_url)

				if len(post.body_html) > 0:
					with tag("content", type="html"):
						doc.cdata(f'''<img alt="{post.realtitle(None)}" loading="lazy" src={image_url}><br>{post.realbody(None)}''')

	return Response( "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+ doc.getvalue(), mimetype="application/xml")