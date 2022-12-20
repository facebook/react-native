module.exports = {
  dependencies: {
    ...(process.env.NO_FLIPPER ? { 'react-native-flipper': { platforms: { ios: null } } } : {}),
  },
  project: {
    ios: {},
    android: {},
  },
};
