import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    data: [
      { date: "01 Fév", commandes: 24, score: 38 },
      { date: "02 Fév", commandes: 31, score: 42 },
      { date: "03 Fév", commandes: 18, score: 35 },
      { date: "04 Fév", commandes: 45, score: 48 },
      { date: "05 Fév", commandes: 38, score: 41 },
      { date: "06 Fév", commandes: 52, score: 44 },
      { date: "07 Fév", commandes: 41, score: 39 },
      { date: "08 Fév", commandes: 35, score: 36 },
      { date: "09 Fév", commandes: 48, score: 43 },
      { date: "10 Fév", commandes: 55, score: 47 },
      { date: "11 Fév", commandes: 42, score: 40 },
      { date: "12 Fév", commandes: 38, score: 37 },
      { date: "13 Fév", commandes: 61, score: 45 },
      { date: "14 Fév", commandes: 58, score: 42 },
    ],
  });
}
