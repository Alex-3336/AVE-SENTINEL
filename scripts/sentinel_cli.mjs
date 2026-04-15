#!/usr/bin/env node

import {
  handleTelegramCommand,
  loadQuoteSnapshot,
  loadRadarSnapshot,
  loadTokenSnapshot,
  renderBriefText,
  renderHelpText,
  renderQuoteText,
  renderRadarText,
  renderRiskText,
  renderTokenText
} from "./sentinel_core.mjs";

function readFlag(args, name, fallback = "") {
  const index = args.indexOf(name);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const command = (args[0] ?? "help").toLowerCase();

  if (command === "help" || command === "--help" || command === "-h") {
    console.log(renderHelpText("cli"));
    return;
  }

  if (command === "telegram") {
    const tgInput = args.slice(1).join(" ");
    console.log(await handleTelegramCommand(tgInput));
    return;
  }

  if (command === "radar") {
    console.log(renderRadarText(await loadRadarSnapshot()));
    return;
  }

  if (command === "brief") {
    console.log(renderBriefText(await loadRadarSnapshot()));
    return;
  }

  if (command === "token" || command === "risk" || command === "quote") {
    const address = args[1];
    const chain = readFlag(args, "--chain", "solana");

    if (!address) {
      throw new Error("缺少 token 地址");
    }

    const snapshot = await loadTokenSnapshot(address, chain);

    if (command === "token") {
      console.log(renderTokenText(snapshot));
      return;
    }

    if (command === "risk") {
      console.log(renderRiskText(snapshot));
      return;
    }

    const usd = Number(readFlag(args, "--usd", "500"));
    const quote = await loadQuoteSnapshot(snapshot, usd);
    console.log(renderQuoteText(snapshot, quote));
    return;
  }

  console.log(renderHelpText("cli"));
}

main().catch((error) => {
  console.error(`AVE Sentinel CLI error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
