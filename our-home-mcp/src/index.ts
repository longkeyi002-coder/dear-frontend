import { createServer } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createOurHomeServer } from "./server.js";
import { JsonStore, parseBoolean } from "./store.js";

const transportMode = process.env.OUR_HOME_MCP_TRANSPORT ?? "stdio";
const dataFile = process.env.OUR_HOME_DATA_FILE ?? "./data/our-home.json";
const seed = parseBoolean(process.env.OUR_HOME_SEED, true);
const store = await JsonStore.open(dataFile, seed);

if (transportMode === "stdio") {
  const server = createOurHomeServer(store);
  await server.connect(new StdioServerTransport());
} else if (transportMode === "http") {
  await startHttpServer();
} else {
  throw new Error(`Unsupported OUR_HOME_MCP_TRANSPORT: ${transportMode}`);
}

async function startHttpServer(): Promise<void> {
  const host = process.env.OUR_HOME_MCP_HOST ?? "127.0.0.1";
  const port = Number(process.env.OUR_HOME_MCP_PORT ?? "8787");
  const token = process.env.OUR_HOME_MCP_TOKEN;
  const corsOrigin = process.env.OUR_HOME_MCP_CORS_ORIGIN;

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("OUR_HOME_MCP_PORT must be a valid TCP port");
  }
  if (host !== "127.0.0.1" && host !== "localhost" && !token) {
    throw new Error("Refusing non-local HTTP binding without OUR_HOME_MCP_TOKEN");
  }

  const httpServer = createServer(async (request, response) => {
    if (corsOrigin) response.setHeader("Access-Control-Allow-Origin", corsOrigin);
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type, Mcp-Session-Id, Last-Event-ID");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");

    if (request.method === "OPTIONS") {
      response.writeHead(204).end();
      return;
    }

    if (request.method === "GET" && request.url === "/healthz") {
      response.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: true, service: "our-home", schemaVersion: 1 }),
      );
      return;
    }

    if (request.url !== "/mcp") {
      response.writeHead(404, { "content-type": "application/json" }).end(JSON.stringify({ error: "Not found" }));
      return;
    }

    if (token && request.headers.authorization !== `Bearer ${token}`) {
      response.writeHead(401, { "content-type": "application/json", "www-authenticate": "Bearer" }).end(JSON.stringify({ error: "Unauthorized" }));
      return;
    }

    try {
      const body = await readJsonBody(request);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });
      const server = createOurHomeServer(store);
      response.on("close", () => void transport.close());
      await server.connect(transport);
      await transport.handleRequest(request, response, body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Request failed";
      if (!response.headersSent) {
        response.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: message }));
      } else {
        response.end();
      }
    }
  });

  httpServer.listen(port, host, () => {
    process.stderr.write(`Our Home MCP listening at http://${host}:${port}/mcp\n`);
  });
}

async function readJsonBody(request: import("node:http").IncomingMessage): Promise<unknown> {
  if (request.method === "GET" || request.method === "DELETE") return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  if (chunks.length === 0) return undefined;
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}
