from sqlalchemy import *
from files.__main__ import Base
import time

class SubSubscription(Base):
	__tablename__ = "sub_subscriptions"
	user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
	sub = Column(String(20), ForeignKey("subs.name"), primary_key=True)
	created_utc = Column(Integer, default=int(time.time()))

	def __repr__(self):
		return f"<SubSubscription(user_id={self.user_id}, sub={self.sub})>"