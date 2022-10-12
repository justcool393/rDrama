import cloneDeep from "lodash.clonedeep";

export function formatMessageGroups(
  users: Record<string, UserEntity>,
  messages: ProcessedMessageEntity[]
) {
  const chatMessageGroups = [] as Array<{
    author: UserEntity;
    messages: ProcessedMessageEntity[];
  }>;

  if (messages.length === 0) {
    return chatMessageGroups;
  } else {
    const chatMessageGroup = {
      author: users[messages[0].user_id],
      messages: [] as ProcessedMessageEntity[],
    };

    for (const message of messages) {
      if (message.user_id === chatMessageGroup.author.id) {
        // Same user: group in with previous messages.
        chatMessageGroup.messages.push(message);
      } else {
        // New user: Finish off the previous batch and start a new one.
        chatMessageGroups.push(cloneDeep(chatMessageGroup));
        chatMessageGroup.author = users[message.user_id];
        chatMessageGroup.messages = [message];
      }
    }

    chatMessageGroups.push(cloneDeep(chatMessageGroup));

    return chatMessageGroups;
  }
}
