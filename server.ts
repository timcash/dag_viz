/// <reference types="bun-types" />
import { watch } from "fs";

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const clients = new Set<any>();

const server = Bun.serve({
    port: port,
    async fetch(req, server) {
        const url = new URL(req.url);
        let path = url.pathname;
        console.log(`[Server] ${req.method} ${path}`);

        if (path === "/live-reload") {
            const success = server.upgrade(req);
            return success ? undefined : new Response("WebSocket upgrade failed", { status: 400 });
        }

        // Try direct file first
        let file = Bun.file(`.${path}`);
        if (await file.exists()) {
            return new Response(file);
        }

        // Default to index.html for root or any unmatched path (SPA)
        const index = Bun.file("./index.html");
        return new Response(index);
    },
    websocket: {
        open(ws) {
            clients.add(ws);
        },
        close(ws) {
            clients.delete(ws);
        },
        message(ws, message) { }
    }
});

// Live Reload watchers
const watchOptions = { recursive: true };
const reload = (filename: string) => {
    console.log(`[Reload] ${filename}`);
    for (const client of clients) {
        client.send("reload");
    }
};

watch("./src", watchOptions, (event, filename) => filename && reload(filename));
watch("./dist", watchOptions, (event, filename) => filename && reload(filename));
watch("./index.html", (event, filename) => reload("index.html"));

console.log(`Listening on http://localhost:${server.port}`);
