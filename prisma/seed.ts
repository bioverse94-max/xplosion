import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clean existing data for clean idempotent runs
  await prisma.auditLog.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.checkIn.deleteMany();
  await prisma.pass.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.registrationItem.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.adminUser.deleteMany();

  // 1. Seed Admin Users
  const superAdminPassword = await bcrypt.hash("AdminPassword@2026!", 10);
  const staffPassword = await bcrypt.hash("StaffPassword@2026!", 10);

  const superAdmin = await prisma.adminUser.create({
    data: {
      email: "admin@freshersparty.internal",
      name: "Operations Director",
      passwordHash: superAdminPassword,
      role: "SUPER_ADMIN",
    },
  });

  const staffAdmin = await prisma.adminUser.create({
    data: {
      email: "staff@freshersparty.internal",
      name: "Door Security Lead",
      passwordHash: staffPassword,
      role: "CHECKIN_STAFF",
    },
  });

  console.log(`✅ Created Admin accounts: ${superAdmin.email}, ${staffAdmin.email}`);

  // 2. Seed Flagship Event: XPLOSION 2K26
  const eventDate = new Date("2026-09-26T12:00:00+05:30"); // 26.09.26 Saturday 12 PM
  const saleStartDate = new Date("2026-01-01T00:00:00+05:30");
  const saleEndDate = new Date("2026-09-26T23:59:59+05:30");

  const rules = [
    "Valid physical college ID card along with digital entry pass is strictly mandatory.",
    "Entry strictly restricted to registered attendees (Age 18+). Government photo ID required.",
    "Doors open at 12:00 PM onwards. No re-entry allowed once checked in.",
    "Prohibited items: Outside food/beverages, weapons, illegal substances, sharp objects.",
    "Dress Code: Nightlife Glam / Grunge Chic / Upscale Streetwear.",
    "The venue management and organizing council reserve the right of admission.",
  ];

  const faqs = [
    {
      question: "How do I receive my entry pass?",
      answer: "Upon successful payment verification, your official digital entry pass with an encrypted cryptographic QR code is generated instantly. You can access it anytime via the /my-pass portal or your registered email.",
    },
    {
      question: "Can I transfer my pass to someone else?",
      answer: "Passes are bound to your verified college credentials and photo ID at check-in. Unauthorized pass transfers are strictly prohibited.",
    },
    {
      question: "What is included with a VIP Lounge Pass?",
      answer: "VIP Pass holders receive priority express door lane access, elevated mezzanine lounge seating, complimentary signature refreshments, and stage-front deck access.",
    },
    {
      question: "What happens if I lose my digital pass?",
      answer: "Simply visit the /my-pass page on this portal, enter your registered 10-digit phone number or email, and your pass will load instantly.",
    },
    {
      question: "What is the refund policy?",
      answer: "Pass cancellations and refund requests are subject to approval up to 72 hours before event start time through the organizing council.",
    },
  ];

  const event = await prisma.event.create({
    data: {
      slug: "xplosion-2k26",
      title: "XPLOSION 2K26",
      tagline: "THE ULTIMATE COLLEGE AFTERPARTY",
      description: "The premier collegiate nightlife experience. High-octane live DJs, massive sound stages, kinetic lighting, premium drinks & dining, and electric campus energy.",
      venueName: "REBORN CLUB & KITCHEN",
      venueAddress: "Plot No. 1, Block GP, Sector V, Salt Lake, Kolkata",
      city: "Kolkata",
      date: eventDate,
      doorsOpenTime: "12 PM ONWARDS",
      rulesJson: JSON.stringify(rules),
      faqsJson: JSON.stringify(faqs),
      bannerImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1600&auto=format&fit=crop",
      isActive: true,
    },
  });

  console.log(`✅ Created Event: ${event.title} (${event.slug})`);

  // 3. Seed Ticket Tiers
  const ticketTiers = [
    {
      name: "Early Bird General Pass",
      tierCode: "EARLY_BIRD",
      price: 499,
      capacity: 150,
      benefitsJson: JSON.stringify([
        "Guaranteed entry before 8:30 PM",
        "Access to main dance floor & performance arena",
        "1x Complimentary welcome beverage coupon",
        "Digital photo booth access",
      ]),
    },
    {
      name: "Regular Stage Pass",
      tierCode: "REGULAR",
      price: 799,
      capacity: 400,
      benefitsJson: JSON.stringify([
        "All-night event access (Doors open 6:30 PM)",
        "Full main floor & 360° laser stage access",
        "2x Refreshment tokens included",
        "Official Freshers 2026 Glow Band",
      ]),
    },
    {
      name: "VIP Lounge Pass",
      tierCode: "VIP",
      price: 1499,
      capacity: 100,
      benefitsJson: JSON.stringify([
        "Priority VIP Express Door Lane (No waiting)",
        "Exclusive elevated Skydeck lounge access",
        "Unlimited gourmet mocktails & snack buffet",
        "Direct artist stage-front viewing deck",
        "Exclusive merchandise gift pack",
      ]),
    },
    {
      name: "Couple / Duo Pass",
      tierCode: "COUPLE",
      price: 1299,
      capacity: 150,
      benefitsJson: JSON.stringify([
        "Single pass valid for 2 attendees (Couple entry)",
        "Priority express entry lane",
        "2x Welcome drinks + photo souvenir pass",
        "Access to both Main Stage and Chillout Terrace",
      ]),
    },
  ];

  for (const tier of ticketTiers) {
    await prisma.ticketType.create({
      data: {
        eventId: event.id,
        name: tier.name,
        tierCode: tier.tierCode,
        price: tier.price,
        currency: "INR",
        capacity: tier.capacity,
        soldCount: 0,
        reservedCount: 0,
        maxPerOrder: 5,
        benefitsJson: tier.benefitsJson,
        saleStart: saleStartDate,
        saleEnd: saleEndDate,
        isVisible: true,
      },
    });
  }

  console.log(`✅ Seeded ${ticketTiers.length} Ticket Categories.`);
  console.log("🌱 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
