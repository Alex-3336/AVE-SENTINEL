import platformFourMeme from "../assets/platform-four-meme.png";
import platformAerodrome from "../assets/platform-aerodrome.png";
import platformJupiter from "../assets/platform-jupiter.png";
import platformMeteora from "../assets/platform-meteora.png";
import platformOrca from "../assets/platform-orca.png";
import platformPancake from "../assets/platform-pancake.png";
import platformPump from "../assets/platform-pump.png";
import platformRaydium from "../assets/platform-raydium.png";
import platformUniswap from "../assets/platform-uniswap.png";

const platformAssets: Array<[RegExp, string, string]> = [
  [/pump/i, platformPump, "PUMP"],
  [/four\.meme/i, platformFourMeme, "four.meme"],
  [/raydium/i, platformRaydium, "Raydium"],
  [/(pancake|cakev2)/i, platformPancake, "PancakeSwap"],
  [/uniswap/i, platformUniswap, "Uniswap"],
  [/aerodrome/i, platformAerodrome, "Aerodrome"],
  [/meteora/i, platformMeteora, "Meteora"],
  [/orca/i, platformOrca, "Orca"],
  [/jupiter/i, platformJupiter, "Jupiter"]
];

function resolvePlatformAsset(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized === "--") return null;
  const matched = platformAssets.find(([pattern]) => pattern.test(normalized));
  return matched ? { src: matched[1], label: matched[2] } : null;
}

function normalizePlatformLabel(value: string) {
  const normalized = value.trim();
  if (!normalized || normalized === "--") return "--";
  if (/pump/i.test(normalized)) return "PUMP";
  if (/raydium/i.test(normalized)) return "Raydium";
  if (/meteora/i.test(normalized)) return "Meteora";
  if (/jupiter/i.test(normalized)) return "Jupiter";
  if (/orca/i.test(normalized)) return "Orca";
  if (/(pancake|cakev2)/i.test(normalized)) return "PancakeSwap";
  if (/uniswap/i.test(normalized)) return "Uniswap";
  if (/aerodrome/i.test(normalized)) return "Aerodrome";
  if (/four\.meme/i.test(normalized)) return "four.meme";
  return normalized.toUpperCase() === "PUMP.FUN" ? "PUMP" : normalized;
}

function platformFallback(value: string) {
  const cleaned = value.trim().replace(/[^a-z0-9]/gi, "");
  return (cleaned[0] ?? "?").toUpperCase();
}

export function PlatformLogo({ value }: { value: string }) {
  const asset = resolvePlatformAsset(value);
  if (!value || value === "--") return null;

  return (
    <span className="platform-logo" aria-hidden="true">
      {asset ? (
        <img
          src={asset.src}
          alt=""
          loading="lazy"
        />
      ) : (
        platformFallback(value)
      )}
    </span>
  );
}

export function PlatformValue({ value }: { value: string }) {
  return (
    <span className="platform-value">
      <PlatformLogo value={value} />
      <span>{normalizePlatformLabel(value)}</span>
    </span>
  );
}
