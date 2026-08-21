import fs from "fs";
import path from "path";

const SCAN_DIRS = ["repositories", "services", "config/beans", "controllers", "advice", "auth", "tasks"];

export function componentScan(baseDir: string): void {
    SCAN_DIRS.forEach((dir) => {
        const fullDir = path.join(baseDir, dir);
        if (fs.existsSync(fullDir)) {
            walk(fullDir);
        }
    })
}

function walk(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    entries.forEach((entry) => {
        const fullPath = path.join(dir, entry.name);

        if(entry.isDirectory()) {
            walk(fullPath);
            return;
        }

        const isSourceFile = /\.(ts|js)$/.test(entry.name);
        const isDeclarationOrTest = entry.name.endsWith(".d.ts") || entry.name.includes(".test.");

        if (isSourceFile && !isDeclarationOrTest) {
            require(fullPath);
        }
    });
}