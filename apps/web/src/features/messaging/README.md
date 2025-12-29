# Messaging Feature

Core messaging functionality for parent-staff communication.

## Structure

```
messaging/
├── components/     # UI components (Sidebar, Thread, etc.)
├── containers/     # Page-level orchestration
├── hooks/          # Stateful logic (socket, scroll, uploads)
├── services/       # API clients and socket handlers
├── utils/          # Pure functions (date formatting, grouping)
└── model/          # TypeScript types
```

## Entry Points

- `MessagesContainer` - Main orchestration component
- `useConversations` - Hook for conversation list
- `useMessages` - Hook for message thread
- `messagingApi` - REST API client
- `messagingSocket` - WebSocket client

## Dependencies

- `@/lib/auth` - User authentication
- `@tanstack/react-query` - Data fetching
- `socket.io-client` - Real-time messaging
