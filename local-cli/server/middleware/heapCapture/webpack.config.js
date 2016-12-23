const webpack = require('webpack');

module.exports = {
  devtool: 'inline-source-map',
  entry: './src/heapCapture.js',
  resolve: {
    extensions: ["", ".js", ".jsx"],
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        include: /\/src\//,
        loader: 'babel-loader',
        query: {
          presets: [ 'react', 'es2015' ],
          plugins: [ 'transform-class-properties' ]
        },
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin('\n// @generated\n', { raw: true }),
  ],
  output: {
    path: './',
    filename: 'bundle.js',
  },
};
