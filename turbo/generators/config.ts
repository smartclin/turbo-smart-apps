import fs from "node:fs";
import path from "node:path";

// Define a clear interface for the JSON you expect
type PackageJSON = {
	name: string;
	version?: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	[key: string]: unknown;
};

// Safely read JSON with type guard
function readJSON<T = unknown>(filePath: string): T {
	const data = fs.readFileSync(filePath, "utf-8");
	return JSON.parse(data) as T;
}

// Example usage: read package.json from apps
const appsDir = path.join(process.cwd(), "apps");

const getPackages = () => {
	const dirs = fs.readdirSync(appsDir, { withFileTypes: true });
	return dirs
		.filter(d => d.isDirectory())
		.map(d => {
			const pkgPath = path.join(appsDir, d.name, "package.json");

			if (!fs.existsSync(pkgPath)) return null;

			const pkg = readJSON<PackageJSON>(pkgPath);
			return {
				name: pkg.name,
				version: pkg.version ?? "0.0.0"
			};
		})
		.filter(Boolean);
};

export const packages = getPackages();
