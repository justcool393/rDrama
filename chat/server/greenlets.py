from time import time
from gevent import Greenlet, sleep
from files.__main__ import app
from .manager import CasinoManager

SCHEDULE_SCAN_RATE = 5


def use_casino_scheduler():
    scheduler = CasinoManager.instance.scheduler

    while True:
        scheduler.scan()
        sleep(SCHEDULE_SCAN_RATE)


Greenlet.spawn(use_casino_scheduler)

