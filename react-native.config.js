const {
  commands: androidCommands,
  projectConfig: androidProjectConfig,
  dependencyConfig: androidDependencyConfig,
} = require('@react-native-community/cli-platform-android');

const {
  commands: iosCommands,
  projectConfig: iosProjectConfig,
  dependencyConfig: iosDependencyConfig,
} = require('@react-native-community/cli-platform-ios');

module.exports = {
  commands: [...androidCommands, ...iosCommands],
  platforms: {
    android: {
      projectConfig: androidProjectConfig,
      dependencyConfig: androidDependencyConfig,
    },
    ios: {
      projectConfig: iosProjectConfig,
      dependencyConfig: iosDependencyConfig,
    },
  },
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
};
