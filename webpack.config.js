const path = require("path");

module.exports = {
  target: ["web", "es6"],
  entry: {
    background: "./src/background.js",
    options: "./src/options.js",
    webpack: "./src/webpack.js",
  },
  // entry: "./src/background.js",
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     title: "Output Management",
  //   }),
  // ],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    assetModuleFilename: "[name][ext]",
  },
  module: {
    rules: [
      // {
      //   test: /\.css$/i,
      //   use: ["style-loader", "css-loader"],
      // },
      {
        test: /\.(png|svg|jpg|jpeg|gif|html|css|json)$/i,
        type: "asset/resource",
      },
    ],
  },
};
