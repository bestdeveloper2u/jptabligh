import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { thanas, unions } from "@shared/schema";
import { eq } from "drizzle-orm";

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

async function seed() {
  console.log("Starting seed process...");

  try {
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
        // Insert thana
        const [newThana] = await db
          .insert(thanas)
          .values(data.thana)
          .returning();
        thanaId = newThana.id;
        console.log(`Created thana: ${data.thana.nameBn}`);
      }

      // Insert unions
      for (const union of data.unions) {
        const existingUnion = await db
          .select()
          .from(unions)
          .where(eq(unions.name, union.name))
          .limit(1);

        if (existingUnion.length === 0) {
          await db.insert(unions).values({
            ...union,
            thanaId,
          });
          console.log(`  - Created union: ${union.nameBn}`);
        } else {
          console.log(`  - Union already exists: ${union.nameBn}`);
        }
      }
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error during seed:", error);
    throw error;
  }
}

seed();
