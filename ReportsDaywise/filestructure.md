rmes-stackoverflow/
├── prisma/
│   ├── schema.prisma       # Full data model with all entities
│   └── seed.ts             # Seeds demo users and sample questions
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── request-otp/route.ts
│   │   │   │   ├── verify-otp/route.ts
│   │   │   │   ├── logout/route.ts
│   │   │   │   └── me/route.ts
│   │   │   ├── questions/
│   │   │   │   ├── route.ts
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── answers/route.ts
│   │   │   │       ├── resolve/route.ts
│   │   │   │       └── reopen/route.ts
│   │   │   ├── comments/route.ts
│   │   │   ├── votes/route.ts
│   │   │   └── notifications/
│   │   │       ├── route.ts
│   │   │       ├── [id]/mark-read/route.ts
│   │   │       └── mark-all-read/route.ts
│   │   ├── auth/login/page.tsx
│   │   ├── questions/
│   │   │   ├── ask/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── notifications/page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── NotificationBell.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── QuestionDetail.tsx
│   │   ├── AnswerList.tsx
│   │   ├── AnswerForm.tsx
│   │   ├── CommentList.tsx
│   │   ├── CommentForm.tsx
│   │   ├── SearchBar.tsx
│   │   ├── TagFilter.tsx
│   │   ├── TagPicker.tsx
│   │   └── NotificationList.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── email.ts
│   │   ├── notifications.ts
│   │   └── constants.ts
│   └── middleware.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── next.config.js