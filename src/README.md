# UroVital

UroVital is a modern, responsive web application for urologists to manage patient information, appointments, and clinical histories. Built with Next.js, TailwindCSS, and ShadCN UI.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

You can log in with the mock user:
- **Email**: `doctor@uroflow.com`
- **Password**: `password123`

## Mock Data

This version of the application uses mock data stored in JSON files under `src/lib/data`. This allows for rapid UI development and prototyping without a live database connection. The data fetching logic is located in `src/lib/actions.ts`.

## Future Database Integration

The mock data structure is designed to be easily replaceable with a real database. The project is set up with an empty `prisma` directory. The next phase of development will involve creating a database schema with Prisma and replacing the mock data fetching functions in `src/lib/actions.ts` with real database queries.
