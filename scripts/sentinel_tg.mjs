#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import {
  handleTelegramAction,
  handleTelegramCommand,
  loadDelegateApprovalSnapshot,
  loadDelegateOrderSnapshot,
  renderTelegramNotification,
  renderHelpText
} from "./sentinel_core.mjs";

function readDotEnv() {
  const envPath = path.resolve(".env");
  const values = {};

  if (!fs.existsSync(envPath)) {
    return values;
  }

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    values[key] = value;
  }

  return values;
}

const dotEnv = readDotEnv();

function envValue(name, fallback = "") {
  return process.env[name] ?? dotEnv[name] ?? fallback;
}

const TELEGRAM_BOT_TOKEN = envValue("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API_BASE = TELEGRAM_BOT_TOKEN
  ? `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`
  : "";
const DEFAULT_LANGUAGE = String(envValue("SENTINEL_TG_DEFAULT_LANGUAGE", "zh")).toLowerCase() === "en"
  ? "en"
  : "zh";
const ALLOWED_CHAT_IDS = String(envValue("TELEGRAM_ALLOWED_CHAT_IDS", ""))
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const POLL_TIMEOUT_SECONDS = Math.max(10, Number(envValue("SENTINEL_TG_POLL_TIMEOUT_SECONDS", "20")) || 20);
const STATE_PATH = path.resolve(envValue("SENTINEL_TG_STATE_PATH", ".sentinel_tg_state.json"));

function createDefaultState() {
  return {
    version: 1,
    offset: 0,
    controls: {
      strategies: {}
    },
    chats: {}
  };
}

function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    return createDefaultState();
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    return {
      ...createDefaultState(),
      ...parsed,
      controls: {
        ...createDefaultState().controls,
        ...(parsed.controls ?? {})
      },
      chats: parsed.chats && typeof parsed.chats === "object" ? parsed.chats : {}
    };
  } catch {
    return createDefaultState();
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function ensureChatState(state, chatId) {
  const key = String(chatId);
  if (!state.chats[key]) {
    state.chats[key] = {
      language: DEFAULT_LANGUAGE,
      selectedAssetsId: "",
      watches: {}
    };
  }
  state.chats[key].language =
    String(state.chats[key].language ?? DEFAULT_LANGUAGE).toLowerCase() === "en" ? "en" : "zh";
  state.chats[key].selectedAssetsId = String(state.chats[key].selectedAssetsId ?? "");
  state.chats[key].watches =
    state.chats[key].watches && typeof state.chats[key].watches === "object"
      ? state.chats[key].watches
      : {};
  return state.chats[key];
}

function buildWatchKey(watch) {
  if (watch.kind === "approval") {
    return `approval:${watch.chain}:${watch.orderId}`;
  }
  return `order:${watch.orderType}:${watch.chain}:${watch.assetsId || "-"}:${watch.orderId}`;
}

function chunkText(text, limit = 3500) {
  const normalized = String(text ?? "");
  if (normalized.length <= limit) {
    return [normalized];
  }

  const lines = normalized.split("\n");
  const chunks = [];
  let current = "";

  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (next.length <= limit) {
      current = next;
      continue;
    }
    if (current) {
      chunks.push(current);
      current = line;
      continue;
    }
    chunks.push(line.slice(0, limit));
    current = line.slice(limit);
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function telegramRequest(method, payload = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("缺少 TELEGRAM_BOT_TOKEN");
  }

  const response = await fetch(`${TELEGRAM_API_BASE}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json();

  if (!response.ok || !data.ok) {
    throw new Error(data.description || `Telegram API ${response.status}`);
  }

  return data.result;
}

async function sendTelegramMessage(chatId, text) {
  const chunks = chunkText(text);
  for (const chunk of chunks) {
    await telegramRequest("sendMessage", {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: true
    });
  }
}

function registerWatches(chatState, watches) {
  const now = new Date().toISOString();
  for (const watch of watches ?? []) {
    const key = buildWatchKey(watch);
    chatState.watches[key] = {
      ...chatState.watches[key],
      ...watch,
      addedAt: chatState.watches[key]?.addedAt ?? now,
      updatedAt: now
    };
  }
}

function removeWatch(chatState, key) {
  delete chatState.watches[key];
}

function isAuthorizedChat(chatId) {
  if (ALLOWED_CHAT_IDS.length === 0) {
    return true;
  }
  return ALLOWED_CHAT_IDS.includes(String(chatId));
}

function isTerminalStatus(status) {
  return /(filled|success|done|completed|executed|settled|fail|error|cancel|reject|expired|take_profit|stop_loss|tp_|sl_)/i.test(
    String(status ?? "")
  );
}

async function processUpdate(update, state) {
  const message = update.message ?? update.edited_message;
  const text = String(message?.text ?? "").trim();
  const chatId = message?.chat?.id;

  if (!text || !chatId) {
    return false;
  }

  if (!isAuthorizedChat(chatId)) {
    await sendTelegramMessage(
      chatId,
      DEFAULT_LANGUAGE === "en"
        ? "This chat is not allowed to control AVE Sentinel."
        : "当前 chat 未被授权控制 AVE Sentinel。"
    );
    return false;
  }

  const chatState = ensureChatState(state, chatId);
  const result = await handleTelegramAction(text, {
    chatState,
    controlState: state.controls,
    language: chatState.language,
    track: true
  });

  if (result.language) {
    chatState.language = result.language;
  }
  if (Array.isArray(result.watches) && result.watches.length > 0) {
    registerWatches(chatState, result.watches);
  }

  await sendTelegramMessage(chatId, result.text);
  return true;
}

async function pollWatchers(state) {
  let changed = false;

  for (const [chatId] of Object.entries(state.chats)) {
    const chatState = ensureChatState(state, chatId);
    const language = chatState.language || DEFAULT_LANGUAGE;

    for (const [key, watch] of Object.entries(chatState.watches)) {
      try {
        if (watch.kind === "approval") {
          const payload = await loadDelegateApprovalSnapshot(watch.chain, watch.orderId);
          const currentStatus = payload.status || "";
          const changedStatus =
            currentStatus !== (watch.lastStatus || "") ||
            (payload.txHash || "") !== (watch.lastTxHash || "") ||
            (payload.errorMessage || "") !== (watch.lastErrorMessage || "");

          if (changedStatus && watch.lastStatus) {
            await sendTelegramMessage(
              chatId,
              renderTelegramNotification(
                {
                  kind: "approval",
                  previousStatus: watch.lastStatus,
                  currentStatus,
                  payload
                },
                language
              )
            );
          }

          chatState.watches[key] = {
            ...watch,
            orderId: payload.orderId || watch.orderId,
            lastStatus: currentStatus,
            lastTxHash: payload.txHash || "",
            lastErrorMessage: payload.errorMessage || "",
            updatedAt: new Date().toISOString()
          };
          changed = true;

          if (isTerminalStatus(currentStatus)) {
            removeWatch(chatState, key);
          }
          continue;
        }

        const payload = await loadDelegateOrderSnapshot({
          chain: watch.chain,
          assetsId: watch.assetsId || "",
          orderId: watch.orderId,
          orderType: watch.orderType
        });
        const currentStatus = payload.status || "";
        const changedStatus =
          currentStatus !== (watch.lastStatus || "") ||
          (payload.txHash || "") !== (watch.lastTxHash || "") ||
          (payload.errorMessage || "") !== (watch.lastErrorMessage || "");

        if (changedStatus && watch.lastStatus) {
          await sendTelegramMessage(
            chatId,
            renderTelegramNotification(
              {
                kind: "order",
                previousStatus: watch.lastStatus,
                currentStatus,
                payload: {
                  ...payload,
                  orderType: watch.orderType,
                  chain: watch.chain
                }
              },
              language
            )
          );
        }

        chatState.watches[key] = {
          ...watch,
          orderId: payload.orderId || watch.orderId,
          lastStatus: currentStatus,
          lastTxHash: payload.txHash || "",
          lastErrorMessage: payload.errorMessage || "",
          updatedAt: new Date().toISOString()
        };
        changed = true;

        if (isTerminalStatus(currentStatus)) {
          removeWatch(chatState, key);
        }
      } catch (error) {
        const nextError = error instanceof Error ? error.message : String(error);
        if (nextError !== watch.lastPollError) {
          chatState.watches[key] = {
            ...watch,
            lastPollError: nextError,
            updatedAt: new Date().toISOString()
          };
          changed = true;
        }
      }
    }
  }

  return changed;
}

async function runBot() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("缺少 TELEGRAM_BOT_TOKEN，无法启动 Telegram 轮询。");
    process.exitCode = 1;
    return;
  }

  const state = loadState();

  for (;;) {
    try {
      const updates = await telegramRequest("getUpdates", {
        offset: state.offset,
        timeout: POLL_TIMEOUT_SECONDS,
        allowed_updates: ["message", "edited_message"]
      });

      let changed = false;
      for (const update of updates) {
        state.offset = Math.max(state.offset, Number(update.update_id ?? 0) + 1);
        const processed = await processUpdate(update, state);
        changed = processed || changed;
      }

      changed = (await pollWatchers(state)) || changed;

      if (changed || updates.length > 0) {
        saveState(state);
      }
    } catch (error) {
      console.error(`AVE Sentinel Telegram error: ${error instanceof Error ? error.message : String(error)}`);
      saveState(state);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function main() {
  const input = process.argv.slice(2).join(" ").trim();

  if (input) {
    console.log(await handleTelegramCommand(input));
    return;
  }

  if (!TELEGRAM_BOT_TOKEN) {
    console.log(renderHelpText("telegram"));
    console.log("\n缺少 TELEGRAM_BOT_TOKEN，当前只输出命令帮助。");
    return;
  }

  await runBot();
}

main().catch((error) => {
  console.error(`AVE Sentinel Telegram error: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
