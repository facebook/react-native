const resolvePlugins = require('./lib/resolvePlugins');

module.exports = function(options) {
  return {
    retainLines: true,
    compact: true,
    comments: false,
    sourceMaps: false,
    plugins: resolvePlugins([
      [
        'react-transform',
        {
          transforms: [{
            transform: 'react-transform-hmr/lib/index.js',
            imports: ['React'],
            locals: ['module'],
          }]
        },
      ],
      'transform-es2015-block-scoping',
      'transform-es2015-constants',
      ['transform-es2015-modules-commonjs', {strict: false, allowTopLevelThis: true}],
    ])
  };
}
