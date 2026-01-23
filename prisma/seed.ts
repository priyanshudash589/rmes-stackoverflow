import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo manager
  const manager = await prisma.user.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Admin Manager",
      role: "MANAGER",
      authAccount: {
        create: {
          email: "admin@company.com",
        },
      },
    },
  });
  console.log(`✅ Created manager: ${manager.name}`);

  // Create demo user
  const user = await prisma.user.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      name: "Demo User",
      role: "USER",
      authAccount: {
        create: {
          email: "user@company.com",
        },
      },
    },
  });
  console.log(`✅ Created user: ${user.name}`);

  // Create sample questions
  const questions = [
    {
      title: "How do I set up the local development environment?",
      description:
        "I'm new to the team and need to set up my development environment. What tools do I need to install and what are the steps to get the project running locally?",
      tags: ["onboarding", "tooling", "devops"],
      status: "ACTIVE" as const,
      createdBy: user.id,
    },
    {
      title: "What is our deployment process for production?",
      description:
        "Can someone explain the full deployment pipeline? I need to understand how code goes from PR merge to production.",
      tags: ["devops", "processes", "infrastructure"],
      status: "RESOLVED" as const,
      createdBy: user.id,
    },
    {
      title: "Where can I find the API documentation?",
      description:
        "Looking for comprehensive API docs for our backend services. Is there a central place where all API endpoints are documented?",
      tags: ["documentation", "backend", "general"],
      status: "OPEN" as const,
      createdBy: manager.id,
    },
  ];

  for (const q of questions) {
    const existing = await prisma.question.findFirst({
      where: { title: q.title },
    });
    if (!existing) {
      const question = await prisma.question.create({ data: q });
      console.log(`✅ Created question: ${question.title.slice(0, 40)}...`);

      // Add sample answer to first question
      if (q.status === "ACTIVE") {
        await prisma.answer.create({
          data: {
            questionId: question.id,
            content:
              "Here's a quick guide:\n\n1. Clone the repository\n2. Install Node.js 18+\n3. Run `npm install`\n4. Copy `.env.example` to `.env.local`\n5. Run `npm run dev`\n\nLet me know if you have any issues!",
            createdBy: manager.id,
            voteCount: 3,
          },
        });
        console.log(`  ↳ Added answer`);
      }

      // Add sample answer to resolved question
      if (q.status === "RESOLVED") {
        await prisma.answer.create({
          data: {
            questionId: question.id,
            content:
              "Our deployment process:\n\n1. PR gets reviewed and merged to main\n2. CI/CD pipeline runs tests\n3. If tests pass, automatic deployment to staging\n4. Manual approval for production deploy\n5. Production deployment via ArgoCD\n\nAll deployments are tracked in our #deploys Slack channel.",
            createdBy: manager.id,
            voteCount: 5,
          },
        });
        console.log(`  ↳ Added answer`);
      }
    }
  }

  console.log("\n✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

