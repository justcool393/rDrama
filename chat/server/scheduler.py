from .config import IN_DEVELOPMENT_MODE, SCHEDULER_LOG_PATH
from .helpers import now


class CasinoScheduler():
    instance = None
    _logs = []
    _time_entries = []

    def __init__(self):
        self._log(f"{now()}) CasinoScheduler initialized")

    def _log(self, message):
        self._logs.append(message)
        logfile = open(SCHEDULER_LOG_PATH, "w+", encoding="utf-8")
        logfile.write("\n".join(self._logs))
        logfile.close()

    def schedule(self, when, task):
        found_existing_time_entry = False

        for time_entry in self._time_entries:
            if time_entry['when'] == when:
                found_existing_time_entry = True
                time_entry['tasks'].append(task)

        if not found_existing_time_entry:
            new_time_entry = {'when': when, 'tasks': [task]}
            self._time_entries.append(new_time_entry)

        if (IN_DEVELOPMENT_MODE):
            self._log(f'{now()}) Scheduled {task} at {when}')

    def scan(self):
        next_time_entries = []
        time_entries_processed = 0

        for time_entry in self._time_entries:
            if now() >= time_entry['when']:
                for task in time_entry['tasks']:
                    task()
                    time_entries_processed += 1

                    if (IN_DEVELOPMENT_MODE):
                        self._log(f'{now()})\t\tRan {task}')
            else:
                next_time_entries.append(time_entry)

        self._time_entries = next_time_entries

        if (IN_DEVELOPMENT_MODE):
            if time_entries_processed > 0:
                self._log(f"-- Ran {time_entries_processed} tasks\n")


CasinoScheduler.instance = CasinoScheduler()
