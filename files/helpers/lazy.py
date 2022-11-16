def lazy(f):
	'''
	Prevents certain properties from having to be recomputed each time they are referenced
	'''
	def wrapper(*args, **kwargs):
		o = args[0]
		if "_lazy" not in o.__dict__:
			setattr(o, '_lazy', {})

		name = f.__name__ + str(args) + str(kwargs),
		
		if name not in getattr(o, "_lazy", {}):
			o._lazy[name] = f(*args, **kwargs)
		return o._lazy[name]
	wrapper.__name__ = f.__name__
	return wrapper
