const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const server = Bun.serve({
    port: port,
    async fetch(req) {
        const url = new URL(req.url);
        let path = url.pathname;
        if (path === "/") path = "/index.html";
        if (path === "/favicon.ico") return new Response(null, { status: 204 });

        try {
            const file = Bun.file(`./${path}`);
            return new Response(file);
        } catch (e) {
            return new Response("Not Found", { status: 404 });
        }
    },
});

console.log(`Listening on http://localhost:${server.port}`);
