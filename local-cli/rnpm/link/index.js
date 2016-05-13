module.exports = [{
  func: require('./src/link'),
  description: 'Links all native dependencies',
  name: 'link [packageName]',
}, {
  func: require('./src/unlink'),
  description: 'Unlink native dependency',
  name: 'unlink <packageName>',
}];
