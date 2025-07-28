const { getDefaultConfig } = require('metro-config');
const blacklist = require('metro-config/src/defaults/exclusionList');

module.exports = (async () => {
    const {
        resolver: { sourceExts, assetExts },
    } = await getDefaultConfig();

    // This regex tells Metro to ignore any folder named 'build' inside any 'android' folder
    // that is itself inside any folder within node_modules.
    const blockListRegex = /.*\\node_modules\\.*\\android\\build\\.*/;

    return {
        transformer: {
            babelTransformerPath: require.resolve('react-native-svg-transformer'),
            getTransformOptions: async () => ({
                transform: {
                    experimentalImportSupport: false,
                    inlineRequires: true,
                },
            }),
        },
        resolver: {
            assetExts: assetExts.filter((ext) => ext !== 'svg'),
            sourceExts: [...sourceExts, 'svg'],
            // Add our new blockList regex to the default list
            blockList: blacklist([blockListRegex]),
        },
    };
})();