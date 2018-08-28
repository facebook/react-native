module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      require('@babel/plugin-transform-runtime'),
      {
        helpers: true,
        regenerator: true,
      },
    ],
  ],
};
