// chalk causes tests to fail.
// mock it so that we can run tests

module.exports = {
  grey: function (x) {};
}
