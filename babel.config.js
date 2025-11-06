module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.js',
          '.ts',
          '.jsx',
          '.tsx',
          '.json',
          '.ios.js',
          '.android.js',
        ],
        alias: {
          '@apis': './src/apis',
          '@atoms': './src/components/atoms',
          '@molecules': './src/components/molecules',
          '@organisms': './src/components/organisms',
          '@language': './src/language',
          '@res': './src/res',
          '@store': './src/store/store',
          '@types': './src/types',
          '@slices': './src/store/slices',
          '@reducers': './src/store/reducers',
          '@utils': './src/utils',
          '@screens': './src/screens',
          '@navigation': './src/navigations',
          '@sheets': './src/action-sheets/',
          '@locales': './src/locales',
          '@hooks': './src/hooks',
          '@file': ''
        },
      },
    ],
    [
      'module:react-native-dotenv',
      {
        envName: 'APP_ENV',
        moduleName: '@env',
        path: '.env',
        allowUndefined: true,
      },
    ],
  ],
};
