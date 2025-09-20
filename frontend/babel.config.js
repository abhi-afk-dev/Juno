// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // This plugin has to be listed last.
      'react-native-worklets/plugin',
    ],
  };
};