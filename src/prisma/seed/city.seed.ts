import path from 'path';
import fs from 'fs';
import prisma from "./prismaClient"; // Importing the shared client instance

type CountryData = {
  name: string;
  cities: string[];
};

export async function citySeed() {
  console.log('[city.seed] Starting...');
  const dataPath = path.join(__dirname, 'city.json'); 
  
  if (!fs.existsSync(dataPath)) {
    console.error(`[city.seed] Error: File not found at ${dataPath}`);
    return;
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const countries: CountryData[] = JSON.parse(rawData);

  console.log(`[city.seed] Found ${countries.length} countries to process`);

  for (const country of countries) {
    // We stick with 'upsert' here because it handles the nested 'cities' relation 
    // much cleaner than the if/else logic used in the flat discount table.
    const result = await prisma.country.upsert({
      where: { name: country.name },
      // If exists: do nothing (or update if you needed to)
      update: {}, 
      // If new: create country AND its cities
      create: {
        name: country.name,
        cities: {
          create: country.cities.map((cityName) => ({
            name: cityName,
          })),
        },
      },
    });
  }

  console.log("[city.seed] done");
}