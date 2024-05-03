const path = require('path');

module.exports = {
  entry: './src/popup/popup.js',  
  output: {
    filename: '[name].bundle.js', //placeholder that will be replaced with the entry name, ensuring that each entry point generates its own bundle.
    path: path.resolve(__dirname, 'dist'),  // 
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
};
