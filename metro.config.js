const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @anthropic-ai/sdk 0.110 lazily requires node:fs / node:path / node:buffer
// inside its credential-chain code (OAuth profiles, workload identity). Those
// branches never execute in this app — the client is always constructed with
// an explicit apiKey — but Metro resolves every require statically and dies
// on the node: scheme. Resolve any node:* specifier to an empty module.
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('node:')) {
    return { type: 'empty' };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
