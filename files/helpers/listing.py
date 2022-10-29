from typing import Any, List, Type, Union
from sqlalchemy import func
from sqlalchemy.orm import scoped_session, Query

from files.classes import *
from files.helpers.get import *

def get_listing(cls:Union[Type[Submission], Type[Comment], Type[User]], db:scoped_session, query:Callable[[Query], Query], keep_func:Optional[Callable[..., bool]], convert_func:Optional[Callable[..., Any]], v:Optional[User]=None, page_size:Optional[int]=PAGE_SIZE):
	"""
	Gets a tuple of a listing of objects and a next exists flag.
	This code attempts to generalize most of the listings all throughout
	the project, from simple listings to listings that could join across
	a table, etc, and also provides an (optional) way to filter and 
	convert these objects
	"""
	if cls not in (Submission, Comment, User):
		raise TypeError("Only submissions, comments, and users are supported")
	db_query = query(db.query(cls))
	listing = db_query.all()
	next_exists = len(listing) > page_size if page_size else False
	if page_size:
		listing = listing[:page_size]

	if keep_func:
		listing = filter(keep_func, listing)
		
	if cls is not User:
		listing = [x.id for x in listing]
	if cls is Submission:
		listing = get_posts(listing, v=v)
	elif cls is Comment:
		listing = get_comments(listing, v=v)

	if convert_func:
		listing = [convert_func(item) for item in listing]
	
	return (listing, next_exists)

def apply_pagination(q:Query, page:Union[str, int]=1, page_size=PAGE_SIZE) -> Query:
	"""
	Applies pagination to a given query
	"""
	try: page = max(int(page), 1)
	except: page = 1
	return q.offset(page_size * (page - 1)).limit(page_size + 1)

def get_filter_listing(cls:Union[Type[Submission], Type[Comment], Type[User]], filter:func, db:scoped_session, v:Optional[User]=None, page=1, paginate=True, page_size=PAGE_SIZE):
	q = lambda q:apply_pagination(q.filter(filter), page, page_size) if paginate else q.filter(filter)
	return get_listing(cls, db, q, None, None, v, page_size)
