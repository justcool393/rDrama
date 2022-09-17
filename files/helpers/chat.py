import time
from enum import Enum
from files.helpers.lazy import lazy
from files.helpers.wrappers import *
from files.helpers.const import blackjack, CHAT_MESSAGE_LENGTH_MAXIMUM
from files.helpers.regex import censor_slurs, mute_regex
from files.helpers.sanitize import sanitize

MESSAGE_LIMIT = 100

class ChatEvent(str, Enum):
    USER_CONNECTED = 'connect'
    USER_DISCONNECTED = 'disconnect'
    USER_TYPED = 'user-typed'
    USER_SPOKE = 'user-spoke'
    MESSAGE_FAILED = 'message-failed'
    MESSAGE_DELETED = 'message-deleted'
    CHAT_STATE_UPDATED = 'chat-state-updated'

class ChatManager():
    online = []
    typing = []
    messages = []
    muted = {}
    total = 0

    @property
    @lazy
    def state(self):
        return {
            'online': self.online,
            'typing': self.typing,
            'messages': self.messages,
            'total': self.total
        }

    def handle_user_connected(self, user):
        if user.username not in self.online:
            self.online.append(user.username)

        return True

    def handle_user_disconnected(self, user):
        if user.username in self.online:
            self.online.remove(user.username)

        return True

    def handle_user_typing(self, user, message):
        if message and user.username not in self.typing:
            self.typing.append(user.username)
        elif not message and user.username in self.typing:
            self.typing.remove(user.username)

            return True

    def handle_message_deleted(self, message_text):
        for message in self.messages:
            if message['text'] == message_text:
                self.messages.remove(message)

        return True

    def handle_user_spoke(self, user, message):
        bad_message = False, False # [Did it succeed? / Does everyone receive it?]

        # Banned? Go away.
        if user.is_banned:
            return bad_message

        # Muted? Shut up. (or clean if time's up)
        username = user.username.lower()
        if username in self.muted:
            if time.time() < self.muted[username]:
                return bad_message
            else:
                del self.muted[username]


        # Don't be sending empty messages.
        text = message[:CHAT_MESSAGE_LENGTH_MAXIMUM].strip()

        if not text:
            return bad_message

        text_html = sanitize(text, count_marseys=True)
        data = {
            'avatar': user.profile_url,
            'hat': user.hat_active,
            'username': user.username,
            'namecolor': user.namecolor,
            'text': text,
            'text_html': text_html,
            'text_censored': censor_slurs(text_html, 'chat'),
            'time': int(time.time()),
        }
        
        if user.shadowbanned:
            return True, False
        elif blackjack and any(i in text.lower() for i in blackjack.split()):
            user.shadowbanned = 'AutoJanny'
            g.db.add(user)
            send_repeatable_notification(CARP_ID, f"{user.username} has been shadowbanned because of a chat message.")
            return True, False
        else:
            self.messages.append(data)
            self.messages = self.messages[-MESSAGE_LIMIT:]
        
        self.total += 1

        if user.admin_level > 1:
            text = text.lower()

            for i in mute_regex.finditer(text):
                username = i.group(1).lower()
                duration = int(int(i.group(2)) * 60 + time.time())
                self.muted[username] = duration

        return True, True