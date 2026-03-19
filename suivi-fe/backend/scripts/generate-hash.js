// scripts/generate-hash.js
// Lance avec : node scripts/generate-hash.js
import bcrypt from "bcrypt";

const password = "ChangeMe2024!";
const hash = await bcrypt.hash(password, 12);

console.log("\n=== Hash bcrypt généré ===");
console.log("Mot de passe :", password);
console.log("Hash         :", hash);
console.log("\nColle ce hash dans 01_KEP_AUTH.sql");
console.log("à la place de : __HASH_A_REMPLACER__");
console.log("Puis exécute le script SQL dans SSMS.\n");