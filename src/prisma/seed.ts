

async function main() {
  try {
    console.log("🚀 Starting seeding...");
    console.log("🎉 Seeding completed!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  }
}

main();
