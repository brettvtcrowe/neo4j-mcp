import { WorkerEntrypoint } from 'cloudflare:workers';
import { ProxyToSelf } from 'workers-mcp';

type Env = {
  NEO4J_URL: string;      // e.g. https://<host>/db/<db>/query/v2  (HTTP Query API)
  NEO4J_USER: string;
  NEO4J_PASSWORD: string; // set with `wrangler secret put NEO4J_PASSWORD`
};

export default class MyMcpWorker extends WorkerEntrypoint<Env> {
  /**
   * @mcp.tool
   * Get a greeting (example MCP tool)
   */
  async sayHello(name: string) {
    return `Hello, ${name}!`;
  }

  /**
   * @mcp.tool
   * Run a Cypher query (safe example)
   */
  async runCypher({ cypher, params = {} }: { cypher: string; params?: Record<string, unknown> }) {
    // Query API v2 request body
    const body = {
      statements: [{ statement: cypher, parameters: params }]
    };

    const auth = btoa(`${this.env.NEO4J_USER}:${this.env.NEO4J_PASSWORD}`);
    const res = await fetch(this.env.NEO4J_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // or 'application/vnd.neo4j.jolt-v2'
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error(`Neo4j HTTP error ${res.status}`);
    return await res.json();
  }

  // MCP over HTTP/S entrypoint
  async fetch(req: Request): Promise<Response> {
    return new ProxyToSelf(this).fetch(req); // handles Streamable HTTP/SSE transport
  }
}
