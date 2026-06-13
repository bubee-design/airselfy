const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the full monorepo so workspace packages (e.g. @workspace/api-client-react)
// are picked up by Metro without needing a separate install.
config.watchFolders = [workspaceRoot];

// Resolve node_modules from both the package directory and the workspace root.
// This handles pnpm's layout where packages are hoisted to the workspace root
// rather than installed inside artifacts/airselfy/node_modules directly.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
