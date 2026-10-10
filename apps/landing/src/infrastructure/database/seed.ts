/**
 * Database seed script (Part 4.2, N8).
 *
 * Loads demo data for development and testing. Refuses to run in production
 * unless SEED_DEMO=true is explicitly set.
 *
 * Seeded data is clearly labelled as demo throughout the application.
 */

import { hash } from "@node-rs/argon2";
import { db } from "./connection";
import * as schema from "./schema";
import { ASSETS } from "@fsjesc/domain/assets";
import { DEMO_EVENTS } from "@fsjesc/domain/events";
import { getAllArticles } from "@/infrastructure/content/articles";
import { usersRepository } from "./repositories/users.repository";
import { portfoliosRepository } from "./repositories/portfolios.repository";
import { assetsRepository } from "./repositories/assets.repository";
import { eventsRepository } from "./repositories/events.repository";
import { articlesRepository } from "./repositories/articles.repository";
import { competitionsRepository } from "./repositories/competitions.repository";

/**
 * Hash a password with argon2id (D4).
 */
async function hashPassword(password: string): Promise<string> {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });
}

/**
 * Seed the database with demo data.
 */
export async function seed() {
  // Guard against running in production
  if (process.env.NODE_ENV === "production" && process.env.SEED_DEMO !== "true") {
    throw new Error("Refusing to seed demo data in production. Set SEED_DEMO=true to override.");
  }

  console.log("🌱 Starting database seed...");

  // 1. Seed assets
  console.log("Seeding assets...");
  for (const asset of ASSETS) {
    await assetsRepository.upsert({
      ticker: asset.ticker,
      name: asset.name,
      sector: asset.sector,
      currency: asset.currency,
      startingPriceCents: asset.startingPriceCents.toString(),
      annualDrift: asset.annualDrift.toString(),
      annualVolatility: asset.annualVolatility.toString(),
      averageDailyVolume: 40000 + (asset.startingPriceCents % 37) * 1000,
    });
  }
  console.log(`✓ Seeded ${ASSETS.length} assets`);

  // 2. Seed demo users
  console.log("Seeding demo users...");
  const demoPassword = "demo-password-1234";
  const passwordHash = await hashPassword(demoPassword);

  const demoUsers = [
    {
      email: "student@fsjesc-fmc.local",
      role: "STUDENT" as const,
      name: "Demo Student",
    },
    {
      email: "member@fsjesc-fmc.local",
      role: "MEMBER" as const,
      name: "Demo Member",
    },
    {
      email: "executive@fsjesc-fmc.local",
      role: "EXECUTIVE" as const,
      name: "Demo Executive",
    },
  ];

  const createdUsers = [];

  /**
   * Bootstrap admin from env if provided.
   *
   * This previously hashed the shared demo password rather than
   * `BOOTSTRAP_ADMIN_PASSWORD`, so the administrator account was created with a
   * well-known password no matter what the environment said — and that password
   * was printed to the console at the end of the run. Both problems are fixed
   * here: the configured password is hashed, and it is never logged.
   *
   * The insert is also guarded on an existing-account check, because the unique
   * constraint on email made a second run of the seed fail outright.
   */
  const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existingAdmin = await usersRepository.findByEmail(adminEmail);

    if (existingAdmin) {
      createdUsers.push(existingAdmin);
      console.log(`  - Skipped ${adminEmail} (already exists)`);
    } else {
      const adminPasswordHash = await hashPassword(adminPassword);
      const [adminUser] = await db
        .insert(schema.users)
        .values({
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: "ADMINISTRATOR",
        })
        .returning();

      if (adminUser) {
        // No portfolio here: step 3 creates one for every entry in createdUsers,
        // so creating it here too would produce a second portfolio per admin.
        await usersRepository.upsertProfile(adminUser.id, {
          name: process.env.BOOTSTRAP_ADMIN_NAME ?? "Platform Administrator",
        });
        createdUsers.push(adminUser);
        console.log(`  ✓ Created administrator: ${adminEmail}`);
      }
    }
  } else if (adminEmail || adminPassword) {
    console.warn(
      "  ! BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must both be set to create the administrator. Skipping.",
    );
  }

  for (const userData of demoUsers) {
    const existing = await usersRepository.findByEmail(userData.email);
    if (!existing) {
      const user = await usersRepository.create({
        email: userData.email,
        passwordHash,
        role: userData.role,
      });
      await usersRepository.upsertProfile(user.id, { name: userData.name });
      createdUsers.push(user);
      console.log(`  ✓ Created ${userData.email} (${userData.role})`);
    } else {
      createdUsers.push(existing);
      console.log(`  - Skipped ${userData.email} (already exists)`);
    }
  }

  // 3. Seed portfolios for demo users
  console.log("Seeding portfolios...");
  const startingCashCents = "10000000"; // 100,000.00 MAD
  for (const user of createdUsers) {
    const existing = await portfoliosRepository.getUserPortfolio(user.id);
    if (!existing) {
      await portfoliosRepository.create({
        userId: user.id,
        startingCashCents,
        isCompetition: 0,
      });
      console.log(`  ✓ Created portfolio for ${user.email}`);
    } else {
      console.log(`  - Skipped portfolio for ${user.email} (already exists)`);
    }
  }

  // 4. Seed events
  console.log("Seeding events...");
  for (const eventData of DEMO_EVENTS) {
    const existing = await eventsRepository.findByTitle(eventData.title);
    if (!existing) {
      await eventsRepository.create({
        title: eventData.title,
        description: eventData.description,
        location: eventData.location ?? "FSJES Casablanca",
        startsAt: eventData.startAt,
        endsAt: eventData.endAt,
        capacity: eventData.capacity ?? 50,
        isPublished: eventData.registrationOpen ? 1 : 0,
      });
      console.log(`  ✓ Created event: ${eventData.title}`);
    } else {
      console.log(`  - Skipped event: ${eventData.title} (already exists)`);
    }
  }

  // 5. Seed articles from content/topics
  console.log("Seeding articles...");
  const articles = await getAllArticles();
  for (const article of articles) {
    const existing = await articlesRepository.findBySlug(article.slug);
    if (!existing) {
      await articlesRepository.create({
        slug: article.slug,
        title: article.frontmatter.title,
        summary: article.frontmatter.summary,
        category: article.frontmatter.category,
        essential: article.frontmatter.essential ? 1 : 0,
      });
      console.log(`  ✓ Created article: ${article.frontmatter.title}`);
    } else {
      console.log(`  - Skipped article: ${article.frontmatter.title} (already exists)`);
    }
  }

  // 6. Seed a competition
  console.log("Seeding competition...");
  const competition = await competitionsRepository.findByName("Demo Trading Challenge");
  if (!competition) {
    const now = new Date();
    const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later

    await competitionsRepository.create({
      name: "Demo Trading Challenge",
      description: "A one-week competition to test your trading skills in the simulated market.",
      startingCashCents: startingCashCents,
      status: "UPCOMING",
      startsAt,
      endsAt,
    });
    console.log("  ✓ Created competition: Demo Trading Challenge");
  } else {
    console.log("  - Skipped competition (already exists)");
  }

  console.log("✅ Database seed complete!");
  console.log(`\nDemo accounts (password: ${demoPassword}):`);  for (const user of demoUsers) {
    console.log(`  ${user.email} - ${user.role}`);
  }
}

// Run seed if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}
