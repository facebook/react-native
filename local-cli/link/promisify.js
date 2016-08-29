module.exports = (func) => new Promise((resolve, reject) =>
  func((err, res) => err ? reject(err) : resolve(res))
);