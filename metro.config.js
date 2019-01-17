module.exports = {
  serializer: {
    getModulesRunBeforeMainModule: () => [
      require.resolve('./Libraries/Core/InitializeCore'),
    ],
    getPolyfills: require('./rn-get-polyfills'),
  },
  resolver: {
    hasteImplModulePath: require.resolve('./jest/hasteImpl'),
  },
  transformer: {
    assetRegistryPath: require.resolve(
      './Libraries/Image/AssetRegistry'
    ),
  },
};
