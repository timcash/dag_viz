import puppeteer from "puppeteer";

async function runTest() {
    console.log("Starting map-navigation smoke test...");

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    try {
        console.log("Navigating to http://localhost:3000...");
        await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

        // Check if the title is correct
        const title = await page.title();
        console.log(`Page title: ${title}`);
        if (title !== "DAG Viz") throw new Error("Title mismatch");

        // Check for the graph container
        const container = await page.$("#graph-container");
        if (!container) throw new Error("Graph container not found");

        // Verify highlight exists
        const highlight = await page.$("#grid-highlight");
        if (!highlight) throw new Error("Grid highlight not found");

        // Check for root nodes
        const nodes = await page.$$(".node");
        console.log(`Found ${nodes.length} nodes at root`);
        if (nodes.length < 2) throw new Error("Expected at least 2 nodes at root");

        // Test Navigation Down (Zoom into Monoid)
        // Find node with text 'Monoid'
        const monoidNode = await page.evaluateHandle(() => {
            const elements = Array.from(document.querySelectorAll('.node'));
            return elements.find(el => el.textContent.includes('Monoid'));
        });

        if (monoidNode) {
            console.log("Clicking 'Monoid' node to zoom in...");
            // @ts-ignore
            await monoidNode.asElement()?.click();

            // Wait for zoom transition and node injection
            await new Promise(r => setTimeout(r, 1000));

            const pathText = await page.$eval("#path-display", el => el.textContent);
            console.log(`Path display after zoom: ${pathText}`);
            if (!pathText?.includes("Root")) throw new Error("Navigation path invalid");

            // Should see inner nodes (Identity, Associativity)
            const innerNodes = await page.$$(".node");
            console.log(`Found ${innerNodes.length} nodes in subgraph`);
            if (innerNodes.length < 2) throw new Error("Inner nodes not found after zoom");
        } else {
            throw new Error("'Monoid' node not found");
        }

        // Test Navigation Up
        console.log("Clicking 'Back' button...");
        await page.click("#back-btn");
        await new Promise(r => setTimeout(r, 500));

        const rootPathText = await page.$eval("#path-display", el => el.textContent);
        console.log(`Path display after back: ${rootPathText}`);
        if (!rootPathText?.startsWith("Root [")) throw new Error("Navigation back failed");

        console.log("Smoke test passed!");
    } catch (error) {
        console.error("Smoke test failed:", error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runTest();
