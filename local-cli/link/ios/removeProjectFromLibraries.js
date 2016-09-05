/**
 * Given an array of xcodeproj libraries and pbxFile,
 * it removes it from that group by comparing basenames
 *
 * Important: That function mutates `libraries` and it's not pure.
 * It's mainly due to limitations of `xcode` library.
 */
module.exports = function removeProjectFromLibraries(libraries, file) {
  libraries.children = libraries.children.filter(library =>
    library.comment !== file.basename
  );
};
