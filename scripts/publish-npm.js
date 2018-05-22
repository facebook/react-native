/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

/**
 * This script publishes a new version of react-native to NPM.
 * It is supposed to run in CI environment, not on a developer's machine.
 *
 * To make it easier for developers it uses some logic to identify with which version to publish the package.
 *
 * To cut a branch (and release RC):
 * - Developer: `git checkout -b 0.XY-stable`
 * - Developer: `git tag v0.XY.0-rc` and `git push --tags` to git@github.com:facebook/react-native.git
 * - CI: test and deploy to npm (run this script) with version 0.XY.0-rc with tag "next"
 *
 * To update RC release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag v0.XY.0-rc1` and `git push --tags` to git@github.com:facebook/react-native.git
 * - CI: test and deploy to npm (run this script) with version 0.XY.0-rc1 with tag "next"
 *
 * To publish a release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag latest`
 * - Developer: `git tag v0.XY.0`
 * - Developer: `git push --tags` to git@github.com:facebook/react-native.git
 * - CI: test and deploy to npm (run this script) with version 0.XY.0 with and not tag (latest is implied by npm)
 *
 * To patch old release:
 * - Developer: `git checkout 0.XY-stable`
 * - Developer: cherry-pick whatever changes needed
 * - Developer: `git tag v0.XY.Z`
 * - Developer: `git push` to git@github.com:facebook/react-native.git (or merge as pull request)
 * - CI: test and deploy to npm (run this script) with version 0.XY.Z with no tag, npm will not mark it as latest if
 * there is a version higher than XY
 *
 * Important tags:
 * If tag v0.XY.0-rcZ is present on the commit then publish to npm with version 0.XY.0-rcZ and tag next
 * If tag v0.XY.Z is present on the commit then publish to npm with version 0.XY.Z and no tag (npm will consider it latest)
 */

/*eslint-disable no-undef */
require('shelljs/global');

const buildBranch = process.env.CIRCLE_BRANCH;

let branchVersion;
if (buildBranch.indexOf('-stable') !== -1) {
  branchVersion = buildBranch.slice(0, buildBranch.indexOf('-stable'));
} else {
  echo('Error: We publish only from stable branches');
  exit(0);
}

// 34c034298dc9cad5a4553964a5a324450fda0385
const currentCommit = exec('git rev-parse HEAD', {silent: true}).stdout.trim();
// [34c034298dc9cad5a4553964a5a324450fda0385, refs/heads/0.33-stable, refs/tags/latest, refs/tags/v0.33.1, refs/tags/v0.34.1-rc]
const tagsWithVersion = exec(`git ls-remote origin | grep ${currentCommit}`, {
  silent: true,
})
  .stdout.split(/\s/)
  // ['refs/tags/v0.33.0', 'refs/tags/v0.33.0-rc', 'refs/tags/v0.33.0-rc1', 'refs/tags/v0.33.0-rc2', 'refs/tags/v0.34.0']
  .filter(
    version =>
      !!version && version.indexOf(`refs/tags/v${branchVersion}`) === 0,
  )
  // ['refs/tags/v0.33.0', 'refs/tags/v0.33.0-rc', 'refs/tags/v0.33.0-rc1', 'refs/tags/v0.33.0-rc2']
  .filter(version => version.indexOf(branchVersion) !== -1)
  // ['v0.33.0', 'v0.33.0-rc', 'v0.33.0-rc1', 'v0.33.0-rc2']
  .map(version => version.slice('refs/tags/'.length));

if (tagsWithVersion.length === 0) {
  echo(
    "Error: Can't find version tag in current commit. To deploy to NPM you must add tag v0.XY.Z[-rc] to your commit",
  );
  exit(1);
}
let releaseVersion;
if (tagsWithVersion[0].indexOf('-rc') === -1) {
  // if first tag on this commit is non -rc then we are making a stable release
  // '0.33.0'
  releaseVersion = tagsWithVersion[0].slice(1);
} else {
  // otherwise pick last -rc tag alphabetically
  // 0.33.0-rc2
  releaseVersion = tagsWithVersion[tagsWithVersion.length - 1].slice(1);
}

// -------- Generating Android Artifacts with JavaDoc
if (exec('./gradlew :ReactAndroid:installArchives').code) {
  echo("Couldn't generate artifacts");
  exit(1);
}

// undo uncommenting javadoc setting
exec('git checkout ReactAndroid/gradle.properties');

echo('Generated artifacts for Maven');

let artifacts = ['-javadoc.jar', '-sources.jar', '.aar', '.pom'].map(suffix => {
  return `react-native-${releaseVersion}${suffix}`;
});

artifacts.forEach(name => {
  if (
    !test(
      '-e',
      `./android/com/facebook/react/react-native/${releaseVersion}/${name}`,
    )
  ) {
    echo(`file ${name} was not generated`);
    exit(1);
  }
});

if (releaseVersion.indexOf('-rc') === -1) {
  // release, package will be installed by default
  exec('npm publish');
} else {
  // RC release, package will be installed only if users specifically do it
  exec('npm publish --tag next');
}

echo(`Published to npm ${releaseVersion}`);

exit(0);
/*eslint-enable no-undef */
