import time

from sqlalchemy import Column, ForeignKey
from sqlalchemy.sql.sqltypes import *

from files.classes import Base

class SubRelationship(Base):
	__tablename__ = NotImplemented
	__abstract__ = True
	user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
	sub = Column(String(20), ForeignKey("subs.name"), primary_key=True)
	created_utc = Column(Integer)

	def __init__(self, *args, **kwargs):
		if "created_utc" not in kwargs: kwargs["created_utc"] = int(time.time())
		super().__init__(*args, **kwargs)

	def __repr__(self):
		return f"<{self.__class__.__name__}(user_id={self.user_id}, sub={self.sub})>"
	
class SubJoin(SubRelationship):
	__tablename__ = "sub_joins"

class SubBlock(SubRelationship):
	__tablename__ = "sub_blocks"

class SubSubcription(SubRelationship):
	__tablename__ = "sub_subscriptions"
