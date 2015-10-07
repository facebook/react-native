// beeper@1.1.0 has a return statement outside of a function
// and therefore doesn't parse. Let's mock it so that we can
// run the tests.

module.exports = function () {};
