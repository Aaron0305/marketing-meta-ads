import { Buffer } from "buffer";
import { WebSocket } from "ws";

const SPANISH_VOICES = {
  female: "es-MX-DaliaNeural",
  male: "es-MX-JorgeNeural",
};

type AzureTtsOptions = {
  voice?: "male" | "female";
};

const WSS_HOST = "speech.platform.bing.com";
const WSS_PATH = "/consumer/speech/synthesize/readaloud/edge/v1";
const TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

function uuid(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

function buildSsml(text: string, voiceName: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="es-MX">
<voice name="${voiceName}"><prosody rate="+0%" pitch="+0Hz" volume="+0%">${escaped}</prosody></voice></speak>`;
}

function ttsWithTimeout(
  text: string,
  voiceName: string,
  timeoutMs = 20000,
): Promise<Buffer> {
  const connectionId = uuid();
  const wsUrl = `wss://${WSS_HOST}${WSS_PATH}?TrustedClientToken=${TOKEN}&ConnectionId=${connectionId}`;

  return new Promise<Buffer>((resolve, reject) => {
    const timeout = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("TTS timeout after " + timeoutMs + "ms"));
    }, timeoutMs);

    const ws = new WebSocket(wsUrl, {
      host: WSS_HOST,
      origin: "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      },
    });

    const chunks: Buffer[] = [];

    ws.on("open", () => {
      // Send speech config
      const config = JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataoptions: { sentenceBoundaryEnabled: false, wordBoundaryEnabled: false },
              outputFormat: "audio-24khz-48kbitrate-mono-mp3",
            },
          },
        },
      });
      ws.send(
        `X-Timestamp:${new Date().toISOString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${config}`,
      );

      // Send SSML
      const ssml = buildSsml(text, voiceName);
      ws.send(
        `X-RequestId:${uuid()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toISOString()}Z\r\nPath:ssml\r\n\r\n${ssml}`,
      );
    });

    ws.on("message", (data, isBinary) => {
      if (!isBinary) {
        const msg = data.toString("utf8");
        if (msg.includes("turn.end")) {
          clearTimeout(timeout);
          resolve(Buffer.concat(chunks));
          ws.close();
        }
        return;
      }

      // Binary message: headers separated from body by \r\n\r\n
      const raw = data as Buffer;
      const headerEnd = raw.indexOf("\r\n\r\n");
      if (headerEnd >= 0) {
        const body = raw.subarray(headerEnd + 4);
        if (body.length > 0) {
          chunks.push(body);
        }
      }
    });

    ws.on("error", (err) => {
      clearTimeout(timeout);
      reject(new Error("TTS WebSocket error: " + err.message));
    });

    ws.on("close", (code, reason) => {
      clearTimeout(timeout);
      if (chunks.length === 0) {
        reject(new Error("TTS WebSocket closed unexpectedly code=" + code + " reason=" + reason));
      }
    });
  });
}

export async function generateAudioBase64(
  text: string,
  options: { voice?: "male" | "female" } = {},
): Promise<string> {
  const voiceName = options.voice === "female"
    ? SPANISH_VOICES.female
    : SPANISH_VOICES.male;

  const errors: string[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const buf = await ttsWithTimeout(text, voiceName);
      if (buf.length === 0) {
        throw new Error("Empty audio buffer");
      }
      return `data:audio/mp3;base64,${buf.toString("base64")}`;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`attempt ${attempt + 1}: ${msg}`);
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  throw new Error("TTS failed: " + errors.join(" | "));
}
