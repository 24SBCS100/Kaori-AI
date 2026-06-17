// scripts/backup-db.ts
// Turso databases are remote; use Turso's dashboard or CLI for exports/backups.

function main() {
  console.log("This project now uses Turso instead of a local SQLite file.");
  console.log("Use the Turso dashboard or CLI to create database backups/exports.");
  console.log("Required env vars: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.");
}

main();
