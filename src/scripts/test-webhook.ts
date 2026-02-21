/**
 * End-to-end webhook test script.
 *
 * Sends two orders for the same phone number to /api/webhook/ingest
 * and displays the scoring results. The second order should score
 * differently because the customer now has history.
 *
 * Usage:
 *   npm run test:webhook
 *   # or with a custom base URL:
 *   BASE_URL=http://localhost:3005 npm run test:webhook
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3005";
const API_KEY = "nt_live_test_1234567890abcdef1234567890abcdef";
const ENDPOINT = `${BASE_URL}/api/webhook/ingest`;

// ── Helpers ──

function separator(label: string) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"═".repeat(60)}\n`);
}

function printFactor(f: { rule: string; points: number; reason: string }) {
  const sign = f.points > 0 ? "+" : f.points === 0 ? " " : "";
  const color =
    f.points > 0 ? "\x1b[31m" : f.points < 0 ? "\x1b[32m" : "\x1b[90m";
  const reset = "\x1b[0m";
  console.log(
    `  ${color}${sign}${String(f.points).padStart(3)}${reset}  ${f.rule.padEnd(16)} ${f.reason}`
  );
}

async function sendOrder(payload: Record<string, unknown>, label: string) {
  separator(label);

  console.log("📤 POST", ENDPOINT);
  console.log("   Payload:", JSON.stringify(payload, null, 2));
  console.log();

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nortoo-key": API_KEY,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error(`❌ HTTP ${res.status}:`, JSON.stringify(json, null, 2));
    return null;
  }

  const data = json.data;
  console.log(`✅ HTTP ${res.status}`);
  console.log();

  // Score + Decision
  const scoreColor =
    data.score <= 30
      ? "\x1b[32m" // green
      : data.score <= 65
      ? "\x1b[33m" // yellow
      : data.score <= 85
      ? "\x1b[31m" // red
      : "\x1b[35m"; // magenta
  const reset = "\x1b[0m";

  console.log(
    `  🎯 Score:     ${scoreColor}${data.score}${reset} / 100`
  );
  console.log(`  📋 Décision:  ${data.decision.toUpperCase()}`);
  console.log(`  ⚡ Risque:    ${data.riskLevel}`);
  console.log(`  🆔 Order ID:  ${data.orderId}`);
  console.log(`  🔒 Opposé:    ${data.opposed ? "OUI" : "Non"}`);
  console.log(`  📊 Confiance: ${Math.round(data.confidence * 100)}%`);
  console.log();

  // Factors
  console.log("  Facteurs de scoring:");
  console.log("  " + "─".repeat(50));
  for (const factor of data.factors) {
    printFactor(factor);
  }
  console.log("  " + "─".repeat(50));
  console.log(
    `  ${scoreColor}  ${String(data.score).padStart(3)}${reset}  TOTAL`
  );

  return data;
}

// ── Main ──

async function main() {
  console.log("\x1b[1m🚀 nortoo Webhook End-to-End Test\x1b[0m");
  console.log(`   Server: ${BASE_URL}`);
  console.log(`   API Key: ${API_KEY.slice(0, 20)}...`);

  // ── Order 1: High risk — Taza, 1200 DH, short address, new customer ──
  const result1 = await sendOrder(
    {
      ref: "TEST-001",
      customer: {
        phone: "+212661999888",
        name: "Test Client",
        city: "Taza",
        address: "Rue 3",
      },
      total: 1200,
      product: "iPhone 15 Case",
      shipping_city: "Taza",
      shipping_address: "Rue 3",
    },
    "ORDER 1 — Nouveau client, Taza, 1200 DH, adresse courte"
  );

  if (!result1) {
    console.error("\n❌ Test arrêté — Commande 1 échouée");
    process.exit(1);
  }

  // ── Order 2: Same phone, lower risk — Casablanca, 89 DH, good address ──
  const result2 = await sendOrder(
    {
      ref: "TEST-002",
      customer: {
        phone: "+212661999888",
        name: "Test Client",
        city: "Casablanca",
        address: "123 Bd Mohammed V, Apt 4, 20000",
      },
      total: 89,
      product: "Coque Samsung Galaxy",
      shipping_city: "Casablanca",
      shipping_address: "123 Bd Mohammed V, Apt 4, 20000",
    },
    "ORDER 2 — Même client, Casablanca, 89 DH, bonne adresse"
  );

  if (!result2) {
    console.error("\n❌ Test arrêté — Commande 2 échouée");
    process.exit(1);
  }

  // ── Comparison ──
  separator("COMPARAISON");

  console.log("  Commande 1 (Taza, 1200 DH, nouveau):");
  console.log(`    Score: ${result1.score} → ${result1.decision.toUpperCase()}`);
  console.log();
  console.log("  Commande 2 (Casa, 89 DH, historique):");
  console.log(`    Score: ${result2.score} → ${result2.decision.toUpperCase()}`);
  console.log();

  const diff = result2.score - result1.score;
  const diffSign = diff > 0 ? "+" : "";
  console.log(
    `  Δ Score: ${diffSign}${diff} points (${
      diff < 0 ? "moins risqué ✅" : diff > 0 ? "plus risqué ⚠️" : "identique"
    })`
  );

  console.log("\n\x1b[1m✅ Test end-to-end terminé avec succès\x1b[0m\n");
}

main().catch((err) => {
  console.error("❌ Erreur fatale:", err);
  process.exit(1);
});
