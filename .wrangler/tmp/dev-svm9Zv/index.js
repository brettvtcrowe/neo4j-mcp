var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
import { WorkerEntrypoint } from "cloudflare:workers";

// node_modules/workers-mcp/dist/index.js
async function Proxy2(request, secret, sendRPC) {
  const { pathname } = new URL(request.url);
  const authorization = request.headers.get("Authorization")?.replace(/^Bearer /, "") || "";
  if (authorization !== secret || secret.length !== 64) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (pathname === "/rpc" && request.method === "POST") {
    const { method, args = [] } = await request.json();
    try {
      const result = await sendRPC(method, args);
      if (result instanceof Response) {
        return result;
      } else if (typeof result === "string") {
        return new Response(result);
      } else {
        return Response.json(result);
      }
    } catch (e) {
      return Response.json({
        content: [
          { type: "text", text: e.message },
          { type: "text", text: JSON.stringify(e.stack) }
        ],
        isError: true
      });
    }
  }
  return new Response(null, { status: 404 });
}
__name(Proxy2, "Proxy");
var ProxyToSelf = class {
  static {
    __name(this, "ProxyToSelf");
  }
  constructor(worker) {
    this.worker = worker;
    this.env = worker.env;
  }
  env;
  async fetch(request) {
    return Proxy2(request, this.env.SHARED_SECRET, (method, args) => {
      const methodReference = this.worker[method];
      if (!methodReference) {
        throw new Error(`WorkerEntrypoint ${this.worker.constructor.name} has no method '${method}'`);
      }
      return this.worker[method].call(this.worker, ...args);
    });
  }
};

// src/index.ts
var MyMcpWorker = class extends WorkerEntrypoint {
  static {
    __name(this, "MyMcpWorker");
  }
  // Explicitly declare env so TypeScript recognizes it
  env;
  /**
   * Example MCP tool: a simple greeting to verify the server is responding.
   */
  async sayHello(name) {
    return `Hello, ${name}! Your Cloudflare MCP server is live.`;
  }
  /**
   * Example MCP tool: execute a Cypher query via Neo4j's HTTP Query API v2.
   * Make sure your NEO4J_URL points to: https://<host>/db/<database>/query/v2
   */
  async runCypher({
    cypher,
    params = {}
  }) {
    const body = {
      statements: [{ statement: cypher, parameters: params }]
    };
    const auth = btoa(`${this.env.NEO4J_USER}:${this.env.NEO4J_PASSWORD}`);
    const res = await fetch(this.env.NEO4J_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`
      },
      body: JSON.stringify(body)
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
  async fetch(request, env, ctx) {
    this.env = env;
    return new ProxyToSelf(this).fetch(request);
  }
};

// ../../home/codespace/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../home/codespace/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-L0dTOD/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = MyMcpWorker;

// ../../home/codespace/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-L0dTOD/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
