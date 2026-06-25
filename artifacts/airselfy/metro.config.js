const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Only watch the shared lib packages this app actually imports from.
// Do NOT watch the entire workspaceRoot — Metro's FallbackWatcher traverses
// every subdirectory, which breaks on stale or non-existent paths under .local/.
config.watchFolders = [
  path.resolve(workspaceRoot, "lib"),
];

// Resolve node_modules from both the package directory and the workspace root
// so pnpm's hoisted layout is fully traversable.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
