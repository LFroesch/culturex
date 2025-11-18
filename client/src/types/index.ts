export interface User {
  _id: string;
  email: string;
  name: string;
  country: string;
  languages: string[];
  languagesToLearn: string[];
  interests: string[];
  bio: string;
  age?: number;
  profilePicture?: string;
  createdAt: string;
}

export interface Post {
  _id: string;
  author: {
    _id: string;
    name: string;
    country: string;
    profilePicture?: string;
  };
  title: string;
  content: string;
  category: string;
  tags: string[];
  images: string[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
}

export interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  text: string;
  createdAt: string;
}

export interface Connection {
  _id: string;
  user1: User;
  user2: User;
  status: 'pending' | 'accepted' | 'rejected';
  requestedBy: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  sender: string;
  receiver: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  user: {
    _id: string;
    name: string;
    profilePicture?: string;
    country: string;
  };
  lastMessage: Message;
}
