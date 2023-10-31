module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
    '@babel/preset-typescript',
  ],
  ignore: ['**/*.dev.sqlite'],
  plugins: [
    [
      require('@babel/plugin-proposal-decorators').default,
      {
        legacy: true,
      },
    ],
    [
      require('@babel/plugin-proposal-class-properties'),
      {
        loose: false,
      },
    ],
    [
      'module-resolver',
      {
        alias: {
          '@modules': './src/modules',
          '@core': './src/core',
          '@shared': './src/shared',
          '@infra': './src/infra',
          '@config': './src/config',
        },
      },
    ],
  ],
};
