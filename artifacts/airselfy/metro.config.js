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

// Exclude paths that cause Metro's FallbackWatcher to crash with ENOENT errors.
// 1. `stripe` / `stripe-replit-sync` create and delete temp dirs during init.
// 2. `.local/skills/.tmp-*` dirs are created by agent skill tools and deleted
//    after use — Metro tries to watch them and crashes when they disappear.
const blockedPaths = [
  /node_modules[/\\](stripe|stripe-replit-sync)[/\\]/,
  /[/\\]\.local[/\\]skills[/\\]\.tmp-/,
];
const { blockList: existingBlockList } = config.resolver;
if (existingBlockList) {
  const existing = Array.isArray(existingBlockList)
    ? existingBlockList
    : [existingBlockList];
  config.resolver.blockList = [...existing, ...blockedPaths];
} else {
  config.resolver.blockList = blockedPaths;
}

module.exports = config;
