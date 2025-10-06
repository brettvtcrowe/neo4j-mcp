// src/index.ts

// These imports come from the Cloudflare Workers runtime and the workers-mcp helper.
// Both will be available once you run:
//   npm install workers-mcp
//   npm install --save-dev @cloudflare/workers-types
import { WorkerEntrypoint } from 'cloudflare:workers';
import { ProxyToSelf } from 'workers-mcp';

// -----------------------------------------------------------------------------
// Define what environment variables exist (matches wrangler.toml [vars])
// -----------------------------------------------------------------------------
interface MyEnv {
  NEO4J_URL: string;
  NEO4J_USER: string;
  NEO4J_PASSWORD: string;
}

// -----------------------------------------------------------------------------
// Main Worker class — this is your MCP server entrypoint
// -----------------------------------------------------------------------------
export default class MyMcpWorker extends WorkerEntrypoint<MyEnv> {
  // Explicitly declare env so TypeScript recognizes it
  env!: MyEnv;

  /**
   * Example MCP tool: a simple greeting to verify the server is responding.
   */
  async sayHello(name: string) {
    return `Hello, ${name}! Your Cloudflare MCP server is live.`;
  }

  /**
   * Example MCP tool: execute a Cypher query via Neo4j's HTTP Query API v2.
   * Make sure your NEO4J_URL points to: https://<host>/db/<database>/query/v2
   */
  async runCypher({
    cypher,
    params = {},
  }: {
    cypher: string;
    params?: Record<string, unknown>;
  }) {
    const body = {
      statements: [{ statement: cypher, parameters: params }],
    };

    // Basic auth using your Neo4j credentials
    const auth = btoa(`${this.env.NEO4J_USER}:${this.env.NEO4J_PASSWORD}`);

    const res = await fetch(this.env.NEO4J_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Neo4j error ${res.status}: ${await res.text()}`);
    }

    return await res.json();
  }

  /**
   * The required fetch() method — Cloudflare calls this for every request.
   * ProxyToSelf automatically wires up MCP transport over HTTP/SSE.
   */
  async fetch(request: Request, env: MyEnv, ctx: ExecutionContext): Promise<Response> {
    this.env = env; // <-- ensures env is defined for ProxyToSelf
    return new ProxyToSelf(this).fetch(request);
  }
}