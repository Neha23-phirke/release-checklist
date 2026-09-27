# Release Checklist Tool

A modern Single Page Application for managing software release checklists.

## Features

- Create releases
- View all releases
- Fixed release checklist with 8 steps
- Check/uncheck checklist steps
- Automatic release status:
  - Planned: 0 completed steps
  - Ongoing: some completed steps
  - Done: all steps completed
- Update additional release information
- Delete releases
- Responsive UI
- GraphQL API
- PostgreSQL database
- Automated tests
- Docker support

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Node.js
- Express
- Apollo GraphQL
- Prisma ORM

### Database
- PostgreSQL
- Neon

## Project Structure

```text
release-checklist/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   └── server.js
│   ├── tests/
│   │   └── status.test.js
│   ├── Dockerfile
│   ├── package.json
│   └── .env
├── frontend/
├── docker-compose.yaml
└── README.md