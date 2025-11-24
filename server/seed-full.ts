import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { thanas, unions, mosques, halqas, users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

// Jamalpur district thanas and unions data
const jamalpurData = [
  {
    thana: { name: "jamalpur-sadar", nameBn: "জামালপুর সদর" },
    unions: [
      { name: "narundi", nameBn: "নরুন্দী" },
      { name: "rashidpur", nameBn: "রশিদপুর" },
      { name: "titpalla", nameBn: "তিতপল্লা" },
      { name: "sharifpur", nameBn: "শরীফপুর" },
      { name: "srinagar", nameBn: "শ্রীনগর" },
      { name: "kamrabad", nameBn: "কামরাবাদ" },
      { name: "fulkocha", nameBn: "ফুলকোচা" },
    ],
  },
  {
    thana: { name: "melandaha", nameBn: "মেলান্দহ" },
    unions: [
      { name: "melandaha-sadar", nameBn: "মেলান্দহ সদর" },
      { name: "jhaugara", nameBn: "ঝাউগড়া" },
      { name: "chikajani", nameBn: "চিকাজানি" },
      { name: "kulkandi", nameBn: "কুলকান্দি" },
      { name: "malijhikanda", nameBn: "মালিঝিকান্দা" },
    ],
  },
  {
    thana: { name: "islampur", nameBn: "ইসলামপুর" },
    unions: [
      { name: "islampur-sadar", nameBn: "ইসলামপুর সদর" },
      { name: "chinaduli", nameBn: "চিনাডুলি" },
      { name: "gualerchar", nameBn: "গোয়ালেরচর" },
      { name: "kulkandi", nameBn: "কুলকান্দি" },
      { name: "noarpara", nameBn: "নোয়ারপাড়া" },
      { name: "partharshi", nameBn: "পার্থর্ষী" },
      { name: "saptagram", nameBn: "সপ্তগ্রাম" },
    ],
  },
  {
    thana: { name: "dewanganj", nameBn: "দেওয়ানগঞ্জ" },
    unions: [
      { name: "dewanganj-sadar", nameBn: "দেওয়ানগঞ্জ সদর" },
      { name: "bahadurabad", nameBn: "বাহাদুরাবাদ" },
      { name: "chikabarjani", nameBn: "চিকাবরজানি" },
      { name: "dangdhara", nameBn: "ডাংধরা" },
      { name: "hatibandha", nameBn: "হাতিবান্ধা" },
    ],
  },
  {
    thana: { name: "madarganj", nameBn: "মাদারগঞ্জ" },
    unions: [
      { name: "madarganj-sadar", nameBn: "মাদারগঞ্জ সদর" },
      { name: "ajgana", nameBn: "আজগানা" },
      { name: "balijuri", nameBn: "বালিজুড়ি" },
      { name: "char-amkhawa", nameBn: "চর আমখাওয়া" },
      { name: "dhanpata", nameBn: "ধানপাতা" },
    ],
  },
  {
    thana: { name: "sarishabari", nameBn: "সরিষাবাড়ি" },
    unions: [
      { name: "sarishabari-sadar", nameBn: "সরিষাবাড়ি সদর" },
      { name: "belgachha", nameBn: "বেলগাছা" },
      { name: "pingna", nameBn: "পিংনা" },
      { name: "pogaldigha", nameBn: "পোগলদিঘা" },
      { name: "talki", nameBn: "তালকি" },
    ],
  },
  {
    thana: { name: "bakshiganj", nameBn: "বকসীগঞ্জ" },
    unions: [
      { name: "bakshiganj-sadar", nameBn: "বকসীগঞ্জ সদর" },
      { name: "aniara", nameBn: "আনিয়ারা" },
      { name: "binodpur", nameBn: "বিনোদপুর" },
      { name: "dhanbari", nameBn: "ধানবাড়ি" },
      { name: "nilakshmia", nameBn: "নিলক্ষ্মীয়া" },
    ],
  },
];

// Sample mosques for each union (realistic mosque names)
const mosqueNames = [
  "জামে মসজিদ",
  "বায়তুল আমান জামে মসজিদ",
  "বায়তুল মুকাররম মসজিদ",
  "ফরিদপুর জামে মসজিদ",
  "কেন্দ্রীয় জামে মসজিদ",
  "আল-আমিন জামে মসজিদ",
  "বড় মসজিদ",
  "পূর্ব পাড়া মসজিদ",
  "পশ্চিম পাড়া মসজিদ",
  "উত্তর পাড়া মসজিদ",
];

// Sample Bengali names
const bengaliNames = [
  "মোহাম্মদ আলী",
  "আব্দুল করিম",
  "মোহাম্মদ রহিম",
  "আব্দুর রহমান",
  "মোহাম্মদ হাসান",
  "আব্দুল হামিদ",
  "মোহাম্মদ ইব্রাহিম",
  "আব্দুল জলিল",
  "মোহাম্মদ সালাম",
  "আব্দুস সামাদ",
  "মোহাম্মদ শফিক",
  "আব্দুল মালেক",
  "মোহাম্মদ নূর",
  "আব্দুল কাদের",
  "মোহাম্মদ জামাল",
  "আব্দুর রশিদ",
  "মোহাম্মদ ফারুক",
  "আব্দুল মান্নান",
  "মোহাম্মদ জাহিদ",
  "আব্দুল আজিজ",
];

async function seed() {
  console.log("Starting full seed process...");

  try {
    // 1. Seed thanas and unions
    console.log("\n=== Seeding Thanas and Unions ===");
    const thanaMap = new Map<string, string>();
    const unionMap = new Map<string, string>();

    for (const data of jamalpurData) {
      // Check if thana already exists
      const existingThana = await db
        .select()
        .from(thanas)
        .where(eq(thanas.name, data.thana.name))
        .limit(1);

      let thanaId: string;

      if (existingThana.length > 0) {
        thanaId = existingThana[0].id;
        console.log(`Thana already exists: ${data.thana.nameBn}`);
      } else {
        const [newThana] = await db
          .insert(thanas)
          .values(data.thana)
          .returning();
        thanaId = newThana.id;
        console.log(`Created thana: ${data.thana.nameBn}`);
      }

      thanaMap.set(data.thana.name, thanaId);

      // Insert unions
      for (const union of data.unions) {
        const existingUnion = await db
          .select()
          .from(unions)
          .where(eq(unions.name, union.name))
          .limit(1);

        let unionId: string;
        if (existingUnion.length === 0) {
          const [newUnion] = await db.insert(unions).values({
            ...union,
            thanaId,
          }).returning();
          unionId = newUnion.id;
          console.log(`  - Created union: ${union.nameBn}`);
        } else {
          unionId = existingUnion[0].id;
          console.log(`  - Union already exists: ${union.nameBn}`);
        }
        unionMap.set(`${data.thana.name}-${union.name}`, unionId);
      }
    }

    // 2. Create super admin user
    console.log("\n=== Creating Super Admin User ===");
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.phone, "01700000000"))
      .limit(1);

    if (existingSuperAdmin.length === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await db.insert(users).values({
        name: "সুপার এডমিন",
        phone: "01700000000",
        password: hashedPassword,
        role: "super_admin",
        email: "admin@jamalpur-tabligh.com",
      });
      console.log("Created super admin user:");
      console.log("  Phone: 01700000000");
      console.log("  Password: admin123");
    } else {
      console.log("Super admin already exists (Phone: 01700000000)");
    }

    // 3. Seed mosques for each union
    console.log("\n=== Seeding Mosques ===");
    let mosquesCreated = 0;

    for (const data of jamalpurData) {
      const thanaId = thanaMap.get(data.thana.name)!;

      for (const union of data.unions) {
        const unionId = unionMap.get(`${data.thana.name}-${union.name}`)!;

        // Add 2-3 mosques per union
        const mosquesPerUnion = Math.floor(Math.random() * 2) + 2; // 2 or 3 mosques

        for (let i = 0; i < mosquesPerUnion; i++) {
          const mosqueName = `${union.nameBn} ${mosqueNames[i % mosqueNames.length]}`;
          
          // Check if mosque already exists
          const existingMosque = await db
            .select()
            .from(mosques)
            .where(eq(mosques.name, mosqueName))
            .limit(1);

          if (existingMosque.length === 0) {
            await db.insert(mosques).values({
              name: mosqueName,
              thanaId,
              unionId,
              address: `${union.nameBn}, ${data.thana.nameBn}`,
              phone: `017${Math.floor(10000000 + Math.random() * 90000000)}`,
            });
            mosquesCreated++;
          }
        }
      }
    }
    console.log(`Created ${mosquesCreated} mosques`);

    // 4. Seed halqas
    console.log("\n=== Seeding Halqas ===");
    let halqasCreated = 0;

    for (const data of jamalpurData) {
      const thanaId = thanaMap.get(data.thana.name)!;

      for (const union of data.unions) {
        const unionId = unionMap.get(`${data.thana.name}-${union.name}`)!;

        // Add 1-2 halqas per union
        const halqasPerUnion = Math.floor(Math.random() * 2) + 1; // 1 or 2 halqas

        for (let i = 0; i < halqasPerUnion; i++) {
          const halqaName = `${union.nameBn} হালকা ${i + 1}`;
          
          const existingHalqa = await db
            .select()
            .from(halqas)
            .where(eq(halqas.name, halqaName))
            .limit(1);

          if (existingHalqa.length === 0) {
            await db.insert(halqas).values({
              name: halqaName,
              thanaId,
              unionId,
              membersCount: Math.floor(Math.random() * 20) + 5, // 5-25 members
            });
            halqasCreated++;
          }
        }
      }
    }
    console.log(`Created ${halqasCreated} halqas`);

    // 5. Create dummy members
    console.log("\n=== Creating Dummy Members ===");
    const allMosques = await db.select().from(mosques);
    let membersCreated = 0;

    for (let i = 0; i < 20; i++) {
      const randomMosque = allMosques[Math.floor(Math.random() * allMosques.length)];
      const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;

      const existingMember = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (existingMember.length === 0) {
        const hashedPassword = await bcrypt.hash("member123", 10);
        const name = bengaliNames[Math.floor(Math.random() * bengaliNames.length)];
        
        await db.insert(users).values({
          name,
          phone,
          password: hashedPassword,
          role: "member",
          thanaId: randomMosque.thanaId,
          unionId: randomMosque.unionId,
          mosqueId: randomMosque.id,
          tabligActivities: [],
        });
        membersCreated++;
      }
    }
    console.log(`Created ${membersCreated} dummy members (Password: member123)`);

    // 6. Create a few managers
    console.log("\n=== Creating Manager Users ===");
    const managerThanas = ["jamalpur-sadar", "melandaha", "islampur"];
    let managersCreated = 0;

    for (let i = 0; i < managerThanas.length; i++) {
      const thanaName = managerThanas[i];
      const thanaId = thanaMap.get(thanaName);
      const phone = `01800000${100 + i}`;

      const existingManager = await db
        .select()
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1);

      if (existingManager.length === 0 && thanaId) {
        const hashedPassword = await bcrypt.hash("manager123", 10);
        const thanaData = jamalpurData.find(d => d.thana.name === thanaName);
        
        await db.insert(users).values({
          name: `${thanaData?.thana.nameBn} ম্যানেজার`,
          phone,
          password: hashedPassword,
          role: "manager",
          thanaId,
        });
        managersCreated++;
      }
    }
    console.log(`Created ${managersCreated} manager users (Password: manager123)`);

    console.log("\n=== Seed Summary ===");
    const totalThanas = await db.select().from(thanas);
    const totalUnions = await db.select().from(unions);
    const totalMosques = await db.select().from(mosques);
    const totalHalqas = await db.select().from(halqas);
    const totalMembers = await db.select().from(users).where(eq(users.role, "member"));
    const totalManagers = await db.select().from(users).where(eq(users.role, "manager"));

    console.log(`Total Thanas: ${totalThanas.length}`);
    console.log(`Total Unions: ${totalUnions.length}`);
    console.log(`Total Mosques: ${totalMosques.length}`);
    console.log(`Total Halqas: ${totalHalqas.length}`);
    console.log(`Total Members: ${totalMembers.length}`);
    console.log(`Total Managers: ${totalManagers.length}`);
    console.log(`\nSuper Admin Login:`);
    console.log(`  Phone: 01700000000`);
    console.log(`  Password: admin123`);

    console.log("\nSeed completed successfully!");
  } catch (error) {
    console.error("Error during seed:", error);
    throw error;
  }
}

seed();
