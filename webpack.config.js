const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          process: "process/browser.js",
        }),
        new NodePolyfillPlugin({
          excludeAliases: ['console', 'buffer'],
        }),
      ],
    },
    node: {
      fs: "empty",
    },
  };