/**
 * Given an array of xcodeproj libraries and pbxFile,
 * it appends it to that group
 *
 * Important: That function mutates `libraries` and it's not pure.
 * It's mainly due to limitations of `xcode` library.
 */
module.exports = function addProjectToLibraries(libraries, file) {
  return libraries.children.push({
    value: file.fileRef,
    comment: file.basename,
  });
};
