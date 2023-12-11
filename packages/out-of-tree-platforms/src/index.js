if (!process.env.BUILD_EXCLUDE_BABEL_REGISTER) {
  require('../../../scripts/build/babel-register').registerForMonorepo();
}

export * from './getPlatformResolver';
