'use strict';

exports.css = {
  test: /\.css$/,
  loader: 'raw',
};

exports.ts = {
  test: /\.ts$/,
  loader: 'awesome-typescript-loader',
  query: {
    babelCore: 'babel-core',
  },
};

exports.js = {
  test: /\.js$/,
  loader: 'babel',
  query: {
    compact: false,
  },
  include: /(angular|rxjs)/,
};

exports.istanbulInstrumenter = {
  enforce: 'post',
  test: /^(.(?!\.test))*\.ts$/,
  loader: 'istanbul-instrumenter-loader',
};

exports.html = {
  test: /\.html$/,
  loader: 'raw',
};

