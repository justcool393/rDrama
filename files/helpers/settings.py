import json
import os

import gevent
import gevent_inotifyx as inotify

from files.helpers.const import SETTINGS_FILENAME

SETTINGS = {
	"Bots": True,
	"Fart mode": False,
	"Read-only mode": False,
	"Signups": True,
	"login_required": False,
}

def reload_settings():
	global SETTINGS
	if not os.path.isfile(SETTINGS_FILENAME):
		save_settings()
	with open(SETTINGS_FILENAME, 'r', encoding='utf_8') as f:
		SETTINGS = json.load(f)

def save_settings():
	with open(SETTINGS_FILENAME, "w", encoding='utf_8') as f:
		json.dump(SETTINGS, f)

def start_watching_settings():
	gevent.spawn(_settings_watcher, SETTINGS_FILENAME)

def _settings_watcher(filename):
	fd = inotify.init()
	try:
		inotify.add_watch(fd, filename, inotify.IN_CLOSE_WRITE)
		while True:
			for event in inotify.get_events(fd, 0):
				print("Reloading site settings", flush=True)
				reload_settings()
				break
			gevent.sleep(0.5)
	finally:
		os.close(fd)
