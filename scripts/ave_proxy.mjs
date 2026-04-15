import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const HOST = "127.0.0.1";
export const PORT = 8787;
export const DATA_UPSTREAM = "https://data.ave-api.xyz";
export const TRADE_UPSTREAM = "https://bot-api.ave.ai";
export const SOLANA_RPC_UPSTREAM = "https://api.mainnet-beta.solana.com";

export function readDotEnvValue(name) {
  try {
    const envText = fs.readFileSync(path.resolve(".env"), "utf8");
    const line = envText
      .split("\n")
      .find((entry) => entry.trim().startsWith(`${name}=`));
    return line ? line.slice(line.indexOf("=") + 1).trim() : "";
  } catch {
    return "";
  }
}

export function resolveAveApiKey() {
  return (
    process.env.VITE_AVE_API_KEY ??
    process.env.AVE_API_KEY ??
    readDotEnvValue("VITE_AVE_API_KEY") ??
    readDotEnvValue("AVE_API_KEY") ??
    ""
  );
}

export function resolveAveApiSecret() {
  return (
    process.env.AVE_API_SECRET ??
    process.env.AVE_ACCESS_SECRET ??
    process.env.AVE_SECRET_KEY ??
    readDotEnvValue("AVE_API_SECRET") ??
    readDotEnvValue("AVE_ACCESS_SECRET") ??
    readDotEnvValue("AVE_SECRET_KEY") ??
    ""
  );
}

const API_KEY = resolveAveApiKey();
const API_SECRET = resolveAveApiSecret();

export function writeCors(res) {
  res.setHeader("Vary", "Origin");
  const origin = res.req?.headers?.origin;
  const allowOrigin =
    typeof origin === "string" &&
    /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)
      ? origin
      : "http://127.0.0.1:4173";
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-KEY");
}

export function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on("data", (chunk) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    req.on("error", reject);
  });
}

export function sortJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue);
  }
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce((acc, key) => {
        acc[key] = sortJsonValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export function buildDelegateSignature(method, requestPath, bodyBuffer) {
  if (!API_KEY || !API_SECRET) {
    throw new Error(
      "Delegate Wallet API requires AVE_API_KEY and one of AVE_API_SECRET, AVE_ACCESS_SECRET, or AVE_SECRET_KEY"
    );
  }

  const timestamp = new Date().toISOString();
  const normalizedMethod = String(method || "GET").toUpperCase();
  const url = new URL(requestPath, TRADE_UPSTREAM);
  const pathname = url.pathname;
  let normalizedBody = "";

  if (bodyBuffer && bodyBuffer.length > 0) {
    const rawBody = bodyBuffer.toString("utf8").trim();
    if (rawBody) {
      try {
        normalizedBody = JSON.stringify(sortJsonValue(JSON.parse(rawBody)));
      } catch {
        normalizedBody = rawBody.replace(/\s+/g, "");
      }
    }
  }

  const message = `${timestamp}${normalizedMethod}${pathname}${normalizedBody}`;
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(message)
    .digest("base64");

  return {
    "AVE-ACCESS-KEY": API_KEY,
    "AVE-ACCESS-TIMESTAMP": timestamp,
    "AVE-ACCESS-SIGN": signature,
    ...(bodyBuffer && bodyBuffer.length > 0 ? { "Content-Type": "application/json" } : {})
  };
}

export function resolveTarget(url) {
  if (url.startsWith("/api/solana/rpc")) {
    return {
      upstreamUrl: new URL(SOLANA_RPC_UPSTREAM),
      headers() {
        return {
          "Content-Type": "application/json"
        };
      }
    };
  }

  if (url.startsWith("/api/ave/v2")) {
    return {
      upstreamUrl: new URL(url.replace(/^\/api\/ave/, ""), DATA_UPSTREAM),
      headers(apiKey) {
        return apiKey ? { "X-API-KEY": apiKey } : undefined;
      }
    };
  }

  if (url.startsWith("/api/ave/trade")) {
    return {
      upstreamUrl: new URL(url.replace(/^\/api\/ave\/trade/, ""), TRADE_UPSTREAM),
      headers(apiKey) {
        return {
          "Content-Type": "application/json",
          ...(apiKey ? { "AVE-ACCESS-KEY": apiKey } : {})
        };
      }
    };
  }

  if (url.startsWith("/api/ave/delegate")) {
    return {
      upstreamUrl: new URL(url.replace(/^\/api\/ave\/delegate/, ""), TRADE_UPSTREAM),
      headers(_apiKey, body, method, originalUrl) {
        return buildDelegateSignature(method, originalUrl.replace(/^\/api\/ave\/delegate/, ""), body);
      }
    };
  }

  return null;
}

export function createAveProxyServer() {
  return http.createServer(async (req, res) => {
    writeCors(res);

    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (!req.url?.startsWith("/api/ave/") && !req.url?.startsWith("/api/solana/")) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const target = resolveTarget(req.url);

    if (!target) {
      res.statusCode = 404;
      res.end();
      return;
    }

    const requestKey = req.headers["x-api-key"];
    const proxyApiKey =
      (Array.isArray(requestKey) ? requestKey[0] : requestKey) ?? API_KEY;
    const body =
      req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
        ? await readBody(req)
        : undefined;

    try {
      const upstreamResponse = await fetch(target.upstreamUrl, {
        method: req.method,
        headers: target.headers(proxyApiKey, body, req.method, req.url),
        body: body && body.length > 0 ? body : undefined
      });
      const responseBody = await upstreamResponse.text();

      res.statusCode = upstreamResponse.status;
      res.setHeader(
        "Content-Type",
        upstreamResponse.headers.get("content-type") ?? "application/json; charset=utf-8"
      );
      res.end(responseBody);
    } catch (error) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          status: 0,
          msg: "Proxy error",
          detail: error instanceof Error ? error.message : String(error)
        })
      );
    }
  });
}

export function startAveProxyServer(options = {}) {
  const host = options.host ?? HOST;
  const port = options.port ?? PORT;
  const server = createAveProxyServer();

  server.listen(port, host, () => {
    console.log(`AVE proxy listening on http://${host}:${port}`);
  });

  return server;
}

const isEntrypoint =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  startAveProxyServer();
}
