from time import time

class CasinoLogger():
    def __init__(self, prefix, path):
        self.logs = []
        self.prefix = prefix
        self.path = path

    def log(self, message):
        self.logs.append(f'[{int(time())}] {self.prefix} {message}')
        logfile = open(self.path, "w+", encoding="utf-8")
        logfile.write("\n".join(self.logs))
        logfile.close()
