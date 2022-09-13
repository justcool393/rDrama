from os import truncate
from files.__main__ import app
from files.helpers.const import *
from files.helpers.get import *
from files.helpers.wrappers import *

@app.get("/order")
@auth_desired
def order(v):
    return render_template("order.html", v=v)

@app.post("/order")
@limiter.limit("1/second;30/minute;200/hour;1000/day")
def create_order():
    return {"success": True}