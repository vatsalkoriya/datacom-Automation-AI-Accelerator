# Kudos System Specification

## Functional Requirements

### User Stories

1. As an authenticated employee, I can select a colleague from a list.
2. As an authenticated employee, I can write a message of appreciation up to 500 characters.
3. As an authenticated employee, I can submit a kudos message and receive clear success or validation feedback.
4. As an authenticated employee, I can view a public feed of recent visible kudos on the dashboard.
5. As an administrator, I can hide inappropriate kudos while retaining its record for audit purposes.
6. As an administrator, I can permanently delete inappropriate or spam kudos.
7. As a user, I cannot submit kudos to myself, empty messages, oversized messages, or the same recipient/message repeatedly.

### Acceptance Criteria

- The current user is visibly authenticated before the kudos form can be used.
- The recipient list contains colleagues and excludes the current user.
- Messages are trimmed, required, and limited to 500 characters.
- Submissions show inline errors and do not mutate the feed when invalid.
- New kudos appear at the top of the feed with sender, recipient, message, and timestamp.
- Hidden kudos are not shown in the public feed.
- Admin-only moderation controls can hide, restore, or delete a kudos.
- Spam and duplicate submissions are rejected with an actionable message.
- The layout works on mobile, tablet, and desktop widths.

## Technical Design

### Database Schema

The browser prototype uses `localStorage` as its persistence adapter. A production deployment should use the following relational tables:

```sql
users (
  id uuid primary key,
  display_name varchar(120) not null,
  email varchar(320) unique not null,
  role varchar(20) not null default 'employee',
  created_at timestamptz not null
);

kudos (
  id uuid primary key,
  sender_id uuid not null references users(id),
  recipient_id uuid not null references users(id),
  message varchar(500) not null,
  is_visible boolean not null default true,
  moderated_by uuid references users(id),
  moderated_at timestamptz,
  reason_for_moderation varchar(500),
  created_at timestamptz not null,
  unique (sender_id, recipient_id, message)
);
```

The `is_visible`, `moderated_by`, `moderated_at`, and `reason_for_moderation` fields preserve moderation history while preventing hidden content from appearing publicly.

### API Endpoints

- `GET /api/users` — returns active colleagues for the recipient selector.
- `GET /api/kudos?limit=20&cursor=` — returns visible, newest-first kudos with pagination.
- `POST /api/kudos` — accepts `{ recipientId, message }`; returns `201` or validation/conflict errors.
- `PATCH /api/admin/kudos/:id` — admin-only action `{ action: "hide" | "restore", reason? }`.
- `DELETE /api/admin/kudos/:id` — admin-only permanent deletion of a kudos record.
- All endpoints require an authenticated session and return structured JSON errors.

### Frontend Components

- `AppShell`: authenticated header, navigation, and responsive page layout.
- `KudosComposer`: recipient selector, character counter, validation, and submission state.
- `KudosFeed`: newest-first cards and empty state.
- `ModerationPanel`: admin-only controls for hiding, restoring, and deleting.
- `Toast`: non-blocking success and error feedback.

### Security, Performance, and Error Handling

- Use server-side sessions or short-lived tokens; enforce role checks on every admin endpoint.
- Sanitize and encode message content on output; never render user text as HTML.
- Apply rate limiting, CSRF protection, authentication, authorization, and audit logging.
- Enforce length, duplicate, profanity/spam, and recipient validation on the server.
- Paginate the feed, index `created_at` and `is_visible`, and cache the colleague list briefly.
- Return safe user-facing errors while logging request IDs and operational details server-side.

## Implementation Plan

1. Define the specification and moderation data model.
2. Create the responsive dashboard shell and accessible form controls.
3. Add a local persistence adapter representing the users and kudos tables.
4. Implement client-side validation for required fields, limits, self-kudos, duplicates, and spam.
5. Implement the feed with newest-first ordering and visible-only filtering.
6. Implement admin moderation actions and audit metadata.
7. Verify keyboard access, responsive layouts, empty states, and error feedback.
8. For deployment, replace the local adapter with authenticated API calls, configure HTTPS, database migrations, monitoring, backups, and rate limiting.

### Testing Strategy

- Unit test validation rules and duplicate/spam detection.
- Integration test create, hide, restore, and delete flows with role enforcement.
- End-to-end test authenticated employee and administrator journeys.
- Run accessibility checks at mobile and desktop breakpoints.

