# import constants then...
from files.helpers.const import SITE

# import flask then...
from flask import request

# import routes
from .admin import *
from .comments import *
from .errors import *
from .reporting import *
from .front import *
from .login import *
from .oauth import *
from .posts import *
from .search import *
from .settings import *
from .static import *
from .users import *
from .votes import *
from .feeds import *
from .awards import *
from .giphy import *
from .subs import *
from .lottery import *
from .casino import *
from .polls import *
from .notifications import *
from .hats import *
if SITE not in ('pcmemes.net', 'watchpeopledie.tv'):
	from .asset_submissions import *
