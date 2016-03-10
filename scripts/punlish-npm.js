'use strict';

/**
 * This script publishes a new version of react-native to NPM.
 * To reduce stress on developers it uses some logic to identify with which version to publish the package.
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
 * TODO can we push version 0.XY.0-rc1?
 *
 * To publish release:
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
 * This logic could be applied to website generation
 * TODO: is latest tag needed if we just can track tags v0.XY.Z on a commit in CI?
 */
require(`shelljs/global`);

// TODO get branch name from git
const CIRCLE_BRANCH = process.env.CIRCLE_BRANCH || '0.32-stable';
const JAVA_VERSION=`1.7`;
const PACKAGE_NAME = `react-native-evergreen`;

let branchVersion;
if (CIRCLE_BRANCH.indexOf(`-stable`) !== -1) {
  branchVersion = CIRCLE_BRANCH.slice(0, CIRCLE_BRANCH.indexOf(`-stable`));
} else {
  echo(`Error: We publish only from stable branches`);
  exit(1);
}
// TODO get it from tag on current commit that looks like v${branchVersion}[-rc.*]

const tagsOnThisCommit = exec(`git tag -l --points-at HEAD`).stdout.split(/\s/)
  .filter(version => !!version && version.indexOf(`v`) === 0);
const tagsWithVersion = tagsOnThisCommit.filter(version => version.indexOf(branchVersion) !== -1);
if (tagsWithVersion.length === 0) {
  echo(`Error: Can't find version tag in current commit. To deploy to NPM you must add tag v0.XY.Z[-rc] to your commit`);
  exit(1);
}
// git returns tags sorted, get the last one without first letter "v"
const releaseVersion = tagsWithVersion[tagsWithVersion.length - 1].slice(1);

// -------- Generating Android Artifacts with JavaDoc
// Java -version outputs to stderr 0_o
const javaVersion = exec(`java -version`).stderr;
if (javaVersion.indexOf(JAVA_VERSION) === -1) {
  echo(`Java version must be 1.7.x in order to generate Javadoc. Check: java -version`);
  exit(1);
}

// TODO strip RC
if (exec(`sed -i.bak 's/^VERSION_NAME=[0-9\.]*-SNAPSHOT/VERSION_NAME=${releaseVersion}.0/g' "ReactAndroid/gradle.properties"`).code) {
  echo(`Couldn't update version for Gradle`);
  exit(1);
}

// Uncomment Javadoc generation
if (exec('sed -i.bak s://\\\ archives\\\ androidJavadocJar:archives\\\ androidJavadocJar:g "ReactAndroid/release.gradle"').code) {
  echo(`Couldn't enable Javadoc generation`);
  exit(1);
}

if (exec(`./gradlew :ReactAndroid:installArchives`).code) {
  echo(`Couldn't generate artifacts`);
  exit(1);
}

echo("Generated artifacts for Maven");

let artifacts = ['-javadoc.jar', '-sources.jar', '.aar', '.pom'].map((suffix) => {
  // TODO strip RC
  return `react-native-${releaseVersion}${suffix}`;
});

artifacts.forEach((name) => {
  if (!test(`-e`, `./android/com/facebook/react/react-native/${releaseVersion}/${name}`)) {
    echo(`file ${name} was not generated`);
    exit(1);
  }
});

// ----------- Reverting changes to local files

exec(`git checkout ReactAndroid/gradle.properties`);
exec(`git checkout ReactAndroid/release.gradle`);



/*

sed -i.bak -E "s/(\"version\":[[:space:]]*\").+(\")/\"version\": \"${RELEASE}.0-rc\"/g" "package.json" || error "Couldn't update version for npm"
sed -i.bak -E "s/(s.version[[:space:]]{13}=[[:space:]].+)/s.version             = \"${RELEASE}.0-rc\"/g" "React.podspec" || error "Couldn't update version for CocoaPods"

npm publish || error "Couldn't publish package to sinopia (${npm_registry})"
*/

exec(`git checkout package.json`);
exec(`git checkout React.podspec`);

echo(`Published to npm ${releaseVersion}`);
// TODO which tag?
exec(`find . -path "*.bak" | xargs rm`);

// exec(`npm publish`);
exit(0);
