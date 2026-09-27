require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const typeDefs = `#graphql
  type Release {
    id: ID!
    name: String!
    date: String!
    additionalInfo: String
    completedSteps: [Int!]!
    status: String!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    releases: [Release!]!
    release(id: ID!): Release
  }

  type Mutation {
    createRelease(
      name: String!
      date: String!
      additionalInfo: String
    ): Release!

    updateRelease(
      id: ID!
      additionalInfo: String
    ): Release!

    toggleStep(
      releaseId: ID!
      stepIndex: Int!
      completed: Boolean!
    ): Release!

    deleteRelease(id: ID!): Boolean!
  }
`;

const CHECKLIST_LENGTH = 8;

function getStatus(completedSteps) {
  if (completedSteps.length === 0) return "planned";
  if (completedSteps.length === CHECKLIST_LENGTH) return "done";
  return "ongoing";
}

function formatRelease(release) {
  const completedSteps = Array.isArray(release.completedSteps)
    ? release.completedSteps
    : [];

  return {
    ...release,
    completedSteps,
    status: getStatus(completedSteps),
    date: release.date.toISOString(),
    createdAt: release.createdAt.toISOString(),
    updatedAt: release.updatedAt.toISOString(),
  };
}

const resolvers = {
  Query: {
    releases: async () => {
      const releases = await prisma.release.findMany({
        orderBy: { date: "asc" },
      });

      return releases.map(formatRelease);
    },

    release: async (_, { id }) => {
      const release = await prisma.release.findUnique({
        where: { id: Number(id) },
      });

      return release ? formatRelease(release) : null;
    },
  },

  Mutation: {
    createRelease: async (_, { name, date, additionalInfo }) => {
      const release = await prisma.release.create({
        data: {
          name,
          date: new Date(date),
          additionalInfo,
          completedSteps: [],
        },
      });

      return formatRelease(release);
    },

    updateRelease: async (_, { id, additionalInfo }) => {
      const release = await prisma.release.update({
        where: { id: Number(id) },
        data: { additionalInfo },
      });

      return formatRelease(release);
    },

    toggleStep: async (_, { releaseId, stepIndex, completed }) => {
      const release = await prisma.release.findUnique({
        where: { id: Number(releaseId) },
      });

      if (!release) {
        throw new Error("Release not found");
      }

      let completedSteps = Array.isArray(release.completedSteps)
        ? [...release.completedSteps]
        : [];

      if (completed) {
        if (!completedSteps.includes(stepIndex)) {
          completedSteps.push(stepIndex);
        }
      } else {
        completedSteps = completedSteps.filter(
          (step) => step !== stepIndex
        );
      }

      completedSteps.sort((a, b) => a - b);

      const updated = await prisma.release.update({
        where: { id: Number(releaseId) },
        data: { completedSteps },
      });

      return formatRelease(updated);
    },

    deleteRelease: async (_, { id }) => {
      await prisma.release.delete({
        where: { id: Number(id) },
      });

      return true;
    },
  },
};

async function startServer() {
  const app = express();

  app.use(cors());

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(apolloServer)
  );

  app.get("/", (req, res) => {
    res.json({
      message: "Release Checklist API is running",
    });
  });

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`API running at http://localhost:${PORT}`);
    console.log(`GraphQL at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});