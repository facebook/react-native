module.exports = [
  {
    func: require('./src/install'),
    description: 'Install and link native dependencies',
    name: 'install [packageName]',
  }, {
    func: require('./src/uninstall'),
    description: 'Uninstall and unlink native dependencies',
    name: 'uninstall [packageName]',
  },
];
