module.exports = function include(partial, source) {
  let isIncluded = true;
  Object.keys(partial).forEach(key => {
    if (source.indexOf(key) === -1) {
      isIncluded = false;
    }
  });

  return isIncluded;
};
