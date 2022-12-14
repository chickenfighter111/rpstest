const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          process: "process/browser.js",
          Buffer: ['buffer', 'Buffer']
        }),
        new NodePolyfillPlugin({
          excludeAliases: ['console'],
        }),
      ],
    },
    node: {
      fs: "empty",
    },
  };