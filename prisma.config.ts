import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Use DATABASE_URL from environment, fallback to local file for development
    url: process.env["DATABASE_URL"] ?? "file:./dev.db",
  },
});
