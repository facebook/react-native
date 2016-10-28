const glob = require('glob');
const path = require('path');

/**
 * Glob pattern to look for xcodeproj
 */
const GLOB_PATTERN = '**/*.xcodeproj';

/**
 * Regexp matching all test projects
 */
const TEST_PROJECTS = /test|example|sample/i;

/**
 * Base iOS folder
 */
const IOS_BASE = 'ios';

/**
 * These folders will be excluded from search to speed it up
 */
const GLOB_EXCLUDE_PATTERN = ['**/@(Pods|node_modules)/**'];

/**
 * Finds iOS project by looking for all .xcodeproj files
 * in given folder.
 *
 * Returns first match if files are found or null
 *
 * Note: `./ios/*.xcodeproj` are returned regardless of the name
 */
module.exports = function findProject(folder) {
  const projects = glob
    .sync(GLOB_PATTERN, {
      cwd: folder,
      ignore: GLOB_EXCLUDE_PATTERN,
    })
    .filter(project => {
      return path.dirname(project) === IOS_BASE || !TEST_PROJECTS.test(project);
    })
    .sort((projectA, projectB) => {
      return path.dirname(projectA) === IOS_BASE? -1 : 1;
    });

  if (projects.length === 0) {
    return null;
  }

  return projects[0];
};
