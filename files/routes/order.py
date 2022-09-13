from files.__main__ import app
from files.helpers.const import *
from files.helpers.get import *
from files.helpers.wrappers import *

@app.get("/order")
@auth_desired
def order(v):
    return render_template("order.html", v=v)


