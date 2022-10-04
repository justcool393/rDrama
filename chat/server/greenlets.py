from gevent import Greenlet, sleep


def _log_state():
    i = 0

    while True:
        i += 1

        logfile = open("foo.txt", "w+", encoding="utf-8")
        logfile.write(str(i))
        logfile.close()

        sleep(1)


# t = Greenlet.spawn(_log_state)
