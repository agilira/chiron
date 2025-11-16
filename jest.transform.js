const { createTransformer } = require('babel-jest');
const path = require('path');

const baseTransformer = createTransformer({
  configFile: path.resolve(__dirname, 'babel.config.js'),
  babelrc: false,
  rootMode: 'upward'
});

module.exports = {
  ...baseTransformer,
  canInstrument: false
};

