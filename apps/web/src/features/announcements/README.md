# Announcements Feature

Global broadcast messaging from staff to all parents.

## Structure

```
announcements/
├── components/     # UI components (List, Card, Modals)
├── containers/     # Page-level orchestration
├── hooks/          # Data fetching hooks
├── services/       # API clients
├── utils/          # Pure functions (priority colors)
└── model/          # TypeScript types
```

## Entry Points

- `AnnouncementsList` - List of all announcements
- `AnnouncementBanner` - Parent-facing unread banner
- `useAnnouncements` - Hook for announcements data
- `announcementsApi` - REST API client

## Dependencies

- `@/lib/auth` - User authentication
- `@tanstack/react-query` - Data fetching
