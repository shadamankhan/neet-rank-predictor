// import_csv_to_firestore.js (CommonJS - fixed for modern csv-parse)
const fs = require("fs");
const admin = require("firebase-admin");
const { parse } = require("csv-parse/sync");
const dotenv = require("dotenv");

dotenv.config();

if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  console.error("❌ Missing FIREBASE_SERVICE_ACCOUNT_JSON in .env");
  process.exit(1);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} catch (err) {
  console.error("❌ Invalid JSON in FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
  process.exit(1);
}

// Ensure private key newlines are actual newlines
if (serviceAccount && typeof serviceAccount.private_key === "string") {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// CSV file path (must be in backend folder)
const CSV_FILE = "./previous_data.csv";

if (!fs.existsSync(CSV_FILE)) {
  console.error("❌ CSV not found:", CSV_FILE);
  process.exit(1);
}

const csvText = fs.readFileSync(CSV_FILE, "utf8");

let rows;
try {
  rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
} catch (err) {
  console.error("❌ Failed to parse CSV:", err.message);
  process.exit(1);
}

async function run() {
  console.log(`📥 Importing ${rows.length} rows...\n`);

  for (const row of rows) {
    const email = row.email?.trim() || null;
    const phone = row.phone?.trim() || null;

    let uid = null;

    // try match user by email in /users collection
    if (email) {
      try {
        const userSnap = await db
          .collection("users")
          .where("email", "==", email)
          .limit(1)
          .get();

        if (!userSnap.empty) {
          uid = userSnap.docs[0].id;
        }
      } catch (err) {
        console.warn("⚠️  Error querying users by email:", err.message);
      }
    }

    const data = {
      uid,
      email,
      phone,
      score: row.score ? Number(row.score) : null,
      predictedRank: row.predictedRank || row.predicted_rank || null,
      percentile: row.percentile ? Number(row.percentile) : null,
      createdAt: row.date ? new Date(row.date) : admin.firestore.FieldValue.serverTimestamp()
    };

    try {
      await db.collection("predictions").add(data);
      console.log(`✔ Imported: ${email || phone || "unknown"}`);
    } catch (err) {
      console.error("❌ Failed to write to Firestore for", email || phone, err.message);
    }
  }

  console.log("\n🎉 DONE — CSV imported successfully!");
  process.exit(0);
}

run();
