import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { unions, mosques, thanas } from "@shared/schema";
import { eq } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

const thanaIds = {
  jamalpurSadar: "60800ac3-9a32-46b4-9922-107d7f9de15e",
  islampur: "039baf8c-d8dd-4e9a-86ea-3d1c2de1b9b2",
  dewanganj: "98387613-571a-4aab-a43a-52ce95efde39",
  madarganj: "092bc60b-99be-418a-996c-66e90a87ca19",
  melandaha: "0c975e2b-fe9b-49f5-8969-b2cffe14cef6",
  sarishabari: "63048798-ea4a-4ac4-8885-8c872fa71919",
  bakshiganj: "1bc7c7b7-cdb5-4813-b315-badc0a0e3893",
};

const missingUnions = [
  // জামালপুর সদর - Missing unions
  { name: "kendua", nameBn: "কেন্দুয়া", thanaId: thanaIds.jamalpurSadar },
  { name: "lakshirchar", nameBn: "লক্ষ্মীরচর", thanaId: thanaIds.jamalpurSadar },
  { name: "tulshirchar", nameBn: "তুলশীরচর", thanaId: thanaIds.jamalpurSadar },
  { name: "itail", nameBn: "ইটাইল", thanaId: thanaIds.jamalpurSadar },
  { name: "ghoradhap", nameBn: "ঘোড়াধাপ", thanaId: thanaIds.jamalpurSadar },
  { name: "banschara", nameBn: "বাঁশচড়া", thanaId: thanaIds.jamalpurSadar },
  { name: "ranagacha", nameBn: "রানাগাছা", thanaId: thanaIds.jamalpurSadar },
  { name: "shahbazpur", nameBn: "শাহবাজপুর", thanaId: thanaIds.jamalpurSadar },
  { name: "mesta", nameBn: "মেষ্টা", thanaId: thanaIds.jamalpurSadar },
  { name: "digpait", nameBn: "দিগপাইত", thanaId: thanaIds.jamalpurSadar },
  
  // ইসলামপুর - Missing unions
  { name: "kulkandi", nameBn: "কুলকান্দি", thanaId: thanaIds.islampur },
  { name: "belgacha", nameBn: "বেলগাছা", thanaId: thanaIds.islampur },
  { name: "sapdhari", nameBn: "সাপধরী", thanaId: thanaIds.islampur },
  { name: "polbandha", nameBn: "পলবান্ধা", thanaId: thanaIds.islampur },
  { name: "gaibandha", nameBn: "গাইবান্ধা", thanaId: thanaIds.islampur },
  { name: "char-putimari", nameBn: "চর পুটিমারী", thanaId: thanaIds.islampur },
  { name: "char-goalini", nameBn: "চর গোয়ালিনী", thanaId: thanaIds.islampur },
  
  // দেওয়ানগঞ্জ - Missing unions
  { name: "char-amkhawa", nameBn: "চর আমখাওয়া", thanaId: thanaIds.dewanganj },
  { name: "chukaibari", nameBn: "চুকাইবাড়ী", thanaId: thanaIds.dewanganj },
  { name: "ramrampur", nameBn: "রামরামপুর", thanaId: thanaIds.dewanganj },
  
  // মাদারগঞ্জ - Missing unions
  { name: "adarvita", nameBn: "আদারভিটা", thanaId: thanaIds.madarganj },
  { name: "gunaritala", nameBn: "গুনারীতলা", thanaId: thanaIds.madarganj },
  { name: "jorkhali", nameBn: "জোড়খালী", thanaId: thanaIds.madarganj },
  { name: "koraichara", nameBn: "কড়াইচড়া", thanaId: thanaIds.madarganj },
  { name: "ghosherpara", nameBn: "ঘোষেরপাড়া", thanaId: thanaIds.madarganj },
  { name: "sidhuli", nameBn: "সিধুলী", thanaId: thanaIds.madarganj },
  
  // মেলান্দহ - Missing unions
  { name: "char-amdi", nameBn: "চর আমদি", thanaId: thanaIds.melandaha },
  { name: "char-kalibhadra", nameBn: "চর কালিভদ্র", thanaId: thanaIds.melandaha },
  { name: "chiknikandi", nameBn: "চিকনিকান্দি", thanaId: thanaIds.melandaha },
  { name: "fulkocha-melandaha", nameBn: "ফুলকোচা", thanaId: thanaIds.melandaha },
  { name: "mohiramkuli", nameBn: "মহিরামকুলি", thanaId: thanaIds.melandaha },
  { name: "nanglakot", nameBn: "নাংগলকোট", thanaId: thanaIds.melandaha },
  { name: "shaktipur", nameBn: "শক্তিপুর", thanaId: thanaIds.melandaha },
  
  // সরিষাবাড়ি - Missing unions
  { name: "awna", nameBn: "আওনা", thanaId: thanaIds.sarishabari },
  { name: "doail", nameBn: "ডোয়াইল", thanaId: thanaIds.sarishabari },
  { name: "kamrabad-sarishabari", nameBn: "কামরাবাদ", thanaId: thanaIds.sarishabari },
  { name: "mahadan", nameBn: "মহাদান", thanaId: thanaIds.sarishabari },
  { name: "bhabkhali", nameBn: "ভাবখালী", thanaId: thanaIds.sarishabari },
  
  // বকসীগঞ্জ - Missing unions
  { name: "battajor", nameBn: "বাট্টাজোড়", thanaId: thanaIds.bakshiganj },
  { name: "bogarchar", nameBn: "বগারচর", thanaId: thanaIds.bakshiganj },
  { name: "dhanua", nameBn: "ধানুয়া", thanaId: thanaIds.bakshiganj },
  { name: "kamalpur", nameBn: "কামালপুর", thanaId: thanaIds.bakshiganj },
  { name: "merur-char", nameBn: "মেরুর চর", thanaId: thanaIds.bakshiganj },
  { name: "sadhurpara", nameBn: "সাধুর পাড়া", thanaId: thanaIds.bakshiganj },
];

async function addMissingData() {
  console.log("Adding missing unions...");
  
  const insertedUnions: { id: string; name: string; nameBn: string; thanaId: string }[] = [];
  
  for (const union of missingUnions) {
    try {
      const result = await db.insert(unions).values(union).returning();
      insertedUnions.push(result[0]);
      console.log(`Added union: ${union.nameBn}`);
    } catch (error: any) {
      if (error.message?.includes("duplicate")) {
        console.log(`Union already exists: ${union.nameBn}`);
      } else {
        console.error(`Error adding union ${union.nameBn}:`, error.message);
      }
    }
  }
  
  console.log(`\nTotal new unions added: ${insertedUnions.length}`);
  
  // Get all unions for adding mosques
  const allUnions = await db.select().from(unions);
  console.log(`\nTotal unions in database: ${allUnions.length}`);
  
  // Add sample mosques for the new unions
  console.log("\nAdding mosques for new unions...");
  
  const mosqueNames = [
    "জামে মসজিদ",
    "বায়তুল মুকাররম মসজিদ",
    "বায়তুল আমান মসজিদ",
    "মদীনা মসজিদ",
    "নূরানী মসজিদ",
  ];
  
  let mosquesAdded = 0;
  
  for (const union of insertedUnions) {
    // Add 2-3 mosques per new union
    const numMosques = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numMosques; i++) {
      const mosqueName = `${union.nameBn} ${mosqueNames[i % mosqueNames.length]}`;
      const phone = `017${Math.floor(10000000 + Math.random() * 90000000)}`;
      
      try {
        await db.insert(mosques).values({
          name: mosqueName,
          thanaId: union.thanaId,
          unionId: union.id,
          address: `${union.nameBn}, জামালপুর`,
          phone: phone,
        });
        mosquesAdded++;
        console.log(`Added mosque: ${mosqueName}`);
      } catch (error: any) {
        console.error(`Error adding mosque:`, error.message);
      }
    }
  }
  
  console.log(`\nTotal new mosques added: ${mosquesAdded}`);
  
  // Print summary
  const finalMosqueCount = await db.select().from(mosques);
  const finalUnionCount = await db.select().from(unions);
  
  console.log("\n=== Summary ===");
  console.log(`Total Unions: ${finalUnionCount.length}`);
  console.log(`Total Mosques: ${finalMosqueCount.length}`);
}

addMissingData()
  .then(() => {
    console.log("\nDone!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
