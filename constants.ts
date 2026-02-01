import { User, UserStatus, Chat, Message, MessageType, Story } from './types';

export const CURRENT_USER_ID = 'me';

export const MOCK_USERS: User[] = [
  {
    id: 'me',
    name: 'Alex Developer',
    mobileNumber: '+15550001',
    avatar: 'https://picsum.photos/200/200?random=1',
    status: UserStatus.ONLINE,
    lastSeen: new Date(),
    about: 'Building the future 🚀'
  },
  {
    id: 'user_1',
    name: 'Sarah Design',
    mobileNumber: '+15550002',
    avatar: 'https://picsum.photos/200/200?random=2',
    status: UserStatus.ONLINE,
    lastSeen: new Date(),
    about: 'Pixels and coffee ☕'
  },
  {
    id: 'user_2',
    name: 'Mike Manager',
    mobileNumber: '+15550003',
    avatar: 'https://picsum.photos/200/200?random=3',
    status: UserStatus.OFFLINE,
    lastSeen: new Date(Date.now() - 3600000),
    about: 'In meetings...'
  },
  {
    id: 'user_3',
    name: 'Emily Engineer',
    mobileNumber: '+15550004',
    avatar: 'https://picsum.photos/200/200?random=4',
    status: UserStatus.BUSY,
    lastSeen: new Date(),
    about: 'Coding mode 💻'
  }
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'chat_1',
    participants: ['me', 'user_1'],
    isGroup: false,
    unreadCount: 2,
    lastMessage: {
      id: 'm1',
      chatId: 'chat_1',
      senderId: 'user_1',
      type: MessageType.TEXT,
      content: 'Hey! Did you see the new designs?',
      timestamp: new Date(Date.now() - 120000),
      read: false
    }
  },
  {
    id: 'chat_2',
    participants: ['me', 'user_2', 'user_3'],
    isGroup: true,
    groupName: 'Product Team',
    groupAvatar: 'https://picsum.photos/200/200?random=10',
    unreadCount: 0,
    lastMessage: {
      id: 'm2',
      chatId: 'chat_2',
      senderId: 'user_2',
      type: MessageType.TEXT,
      content: 'Meeting in 10 mins everyone.',
      timestamp: new Date(Date.now() - 300000),
      read: true
    }
  }
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    chatId: 'chat_1',
    senderId: 'user_1',
    type: MessageType.TEXT,
    content: 'Hey! Did you see the new designs?',
    timestamp: new Date(Date.now() - 120000),
    read: false
  },
  {
    id: 'm3',
    chatId: 'chat_1',
    senderId: 'me',
    type: MessageType.TEXT,
    content: 'Not yet, sending them now?',
    timestamp: new Date(Date.now() - 180000),
    read: true
  }
];

export const MOCK_STORIES: Story[] = [
  {
    id: 's1',
    userId: 'user_1',
    mediaUrl: 'https://picsum.photos/400/800?random=20',
    mediaType: 'image',
    timestamp: new Date(Date.now() - 7200000),
    viewers: ['me']
  }
];
