import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env.local if it exists
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
// Then load from .env (won't overwrite existing variables)
dotenv.config();


import { migrationRegistry, SupabaseDatabaseClient } from "./migrations";

import "./migrations";

const args = process.argv.slice(2);
const command = args[0];

if (command === "help" || command === "--help" || command === "-h") {
  showHelp();
  process.exit(0);
}

if (command === "--version" || command === "-v") {
  console.log("Version: 1.0.0");
  process.exit(0);
}

if (!command) {
  showHelp();
  process.exit(0);
}

async function runMigrations() {
  console.log("🚀 Running pending migrations...");

  try {
    const db = new SupabaseDatabaseClient();
    await migrationRegistry.migrate(db);
    console.log("✅ All migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

async function showStatus() {
  console.log("📊 Migration Status:");

  const allMigrations = migrationRegistry.getAll();
  const applied = await migrationRegistry.getAppliedMigrations();
  const pending = await migrationRegistry.getPending();

  console.log(`\n📋 Total Migrations: ${allMigrations.length}`);
  console.log(`✅ Applied: ${applied.length}`);
  console.log(`⏳ Pending: ${pending.length}`);

  if (allMigrations.length === 0) {
    console.log("\n💡 No migrations are currently registered.");
    console.log(
      "   This is expected after removing old user, contractor profile, proposal, and project migrations."
    );
    console.log(
      "   New migrations can be created using: pnpm db:migrate create <name>"
    );
  } else if (pending.length > 0) {
    console.log("\n⏳ Pending Migrations:");
    pending.forEach((migration) => {
      console.log(`  - ${migration.name} (v${migration.version})`);
    });
  }

  if (applied.length > 0) {
    console.log("\n✅ Applied Migrations:");
    applied.forEach((status) => {
      const appliedDate = status.appliedAt instanceof Date 
        ? status.appliedAt.toISOString() 
        : status.appliedAt;
      console.log(
        `  - ${status.id} (v${status.version}) - ${appliedDate}`
      );
    });
  }
}

async function rollback(targetVersion: number) {
  console.log(`🔄 Rolling back to version ${targetVersion}...`);

  try {
    const db = new SupabaseDatabaseClient();
    await migrationRegistry.rollback(targetVersion, db);
    console.log("✅ Rollback completed successfully!");
  } catch (error) {
    console.error("❌ Rollback failed:", error);
    process.exit(1);
  }
}

async function createMigration(name: string) {
  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const version = Math.floor(Date.now() / 1000);
  const fileName = `${timestamp}_${name}.sql`;

  console.log(`📝 Creating migration: ${fileName}`);
  console.log(`📍 Location: database/migrations/${fileName}`);
  console.log(`🔢 Version: ${version}`);

  console.log("\n💡 Next steps:");
  console.log("1. Edit the migration file with your SQL");
  console.log("2. Run: pnpm db:migrate");
}

function showHelp() {
  console.log(`
🚀 BuildReady Database Migration CLI

Usage: pnpm db:migrate [command] [options]

Commands:
  migrate              Run all pending migrations
  status               Show migration status
  rollback <version>   Rollback to specific version
  create <name>        Create new migration file
  help                 Show this help message

Examples:
  pnpm db:migrate migrate
  pnpm db:migrate status
  pnpm db:migrate rollback 5
  pnpm db:migrate create new_schema

Options:
  --help, -h          Show help message
  --version, -v       Show version

Note: Old migrations related to users, contractor profiles, proposals, and projects have been removed.
      New migrations can be created as needed.
  `);
}

async function main() {
  console.log("🏗️  BuildReady Database Migration Tool");
  console.log("=====================================\n");

  switch (command) {
    case "migrate":
      const allMigrations = migrationRegistry.getAll();
      if (allMigrations.length === 0) {
        console.log("💡 No migrations are currently registered.");
        console.log(
          "   This is expected after removing old user, contractor profile, proposal, and project migrations."
        );
        console.log(
          "   New migrations can be created using: pnpm db:migrate create <name>"
        );
      } else {
        await runMigrations();
      }
      break;

    case "status":
      await showStatus();
      break;

    case "rollback":
      const allMigrationsForRollback = migrationRegistry.getAll();
      if (allMigrationsForRollback.length === 0) {
        console.log("💡 No migrations are currently registered.");
        console.log("   Rollback is not available when no migrations exist.");
        break;
      }

      const version = parseInt(args[1]);
      if (isNaN(version)) {
        console.error(
          "❌ Invalid version number. Use: pnpm db:migrate rollback <version>"
        );
        process.exit(1);
      }
      await rollback(version);
      break;

    case "create":
      const name = args[1];
      if (!name) {
        console.error(
          "❌ Migration name required. Use: pnpm db:migrate create <name>"
        );
        process.exit(1);
      }
      await createMigration(name);
      break;

    default:
      if (!command) {
        console.log(
          '❌ No command specified. Use "help" for available commands.'
        );
        process.exit(1);
      } else {
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
      }
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error("❌ CLI Error:", error);
    process.exit(1);
  });
}
