import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Supabase database seeding...");

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

  // 2. Seed Flagship Event
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + 30);
  eventDate.setHours(19, 0, 0, 0);

  const saleStartDate = new Date();
  saleStartDate.setDate(saleStartDate.getDate() - 2);

  const saleEndDate = new Date(eventDate);
  saleEndDate.setHours(23, 59, 59, 999);

  const rules = [
    "Valid physical college ID card along with digital pass is mandatory for entry.",
    "Entry strictly restricted to registered attendees (Age 18+). Government photo ID required.",
    "Doors close strictly at 10:30 PM. No re-entry allowed once checked in.",
    "Prohibited items: Outside food/beverages, weapons, illegal substances, laser pointers.",
    "Dress Code: Club Glam / Cyber-Chic / Upscale Casual.",
    "The venue management and organizing council reserve the right of admission.",
  ];

  const faqs = [
    {
      question: "How do I receive my entry pass?",
      answer: "Upon successful payment verification, an encrypted digital pass with a cryptographic QR code is generated instantly. You can view, download, or access it anytime via the /my-pass portal or your registered email.",
    },
    {
      question: "How do I log in?",
      answer: "You can log in anytime using your registered 10-digit mobile phone number on the /login page.",
    },
    {
      question: "Can I transfer my pass to someone else?",
      answer: "Passes are uniquely bound to your verified college credentials and photo ID at check-in. Unauthorized pass transfers are strictly prohibited.",
    },
    {
      question: "What is included with a VIP pass?",
      answer: "VIP Pass holders receive priority expedited check-in lane access, elevated mezzanine lounge seating, complimentary signature mocktails, and backstage photography access.",
    },
  ];

  const event = await prisma.event.create({
    data: {
      slug: "neon-genesis-freshers-2026",
      title: "NEON GENESIS 2026: The Official Freshers Night",
      tagline: "High-voltage music, immersive visual stages & the ultimate welcoming experience.",
      description: "Welcome to the grandest collegiate nightlife festival of the season. Step into an electrified atmosphere featuring high-tier sound systems, kinetic light installations, top curated DJs, interactive campus games, gourmet mocktail lounges, and an unforgettable dance floor experience.",
      venueName: "Club Hyperion & Skydeck",
      venueAddress: "Level 4, Grand Cyber Hub, Phase 2, Technology Corridor",
      city: "Bhubaneswar",
      date: eventDate,
      doorsOpenTime: "06:30 PM IST",
      rulesJson: JSON.stringify(rules),
      faqsJson: JSON.stringify(faqs),
      bannerImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1600&auto=format&fit=crop",
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
  console.log("🌱 Supabase Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
