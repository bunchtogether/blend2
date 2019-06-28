module.exports = {
  entry: `${__dirname}/src-www/player/index.js`,
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.js'],
  },
  mode: 'production',
  devtool: 'source-map',
  output: {
    path: `${__dirname}/dist-www/player/`,
    publicPath: '/',
    filename: 'index.js',
  },
};
