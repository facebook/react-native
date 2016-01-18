The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

Future releases:

- **0.17 branch cut**, 0.17.0-rc - beginning of **week of Dec 7**
- 0.17.0 - Dec 17
- (Holiday break)
- **0.18 branch cut**, 0.18.0-rc - **week of Jan 4**
- 0.18.0 - Jan 18
- **0.19 branch cut**, 0.19.0-rc - **week of Jan 18**
- 0.19.0 - Feb 1
- **0.20 branch cut**, 0.19.0-rc - **week of Feb 1**
- 0.20.0 - Feb 15
- ...

## Ideas for improvements

- A lot of these steps could be done by a script
- We could simplify the process quite a bit by publishing the Android binaries to npm. This will increase the size of the npm package by about 3.3MB. To do that: after `installArchives`, move the binaries to somewhere where `npm publish` will pick them up. Then, change the `build.gradle` file(s) of your generated app so that Gradle will pick up the binaries from `node_modules`. This will likely also **fix issues with incompatible versions of JS and Android binaries** (e.g. [#4488](https://github.com/facebook/react-native/issues/4488)).

## One time setup

Set up Sinopia: https://github.com/facebook/react-native/tree/master/react-native-cli

## Cut a release branch

To cut a release branch and check that everything works, you'll need Mac OS with the [Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md).

Run:

    cd react-native
    ./scripts/release.sh 0.19   # Replace 0.19 with the version you're cutting the branch for :)

#### Check that everything works

Make absolutely sure basic iOS and Android workflow works on master, see the instructions printed by `release.sh`.
  
#### Push to github

  - Check git history, the last commit should be "[0.19-rc] Bump version numbers" (with the correct version)
  - `git push origin 0.version_you_are_releasing-stable`

## Do a release

Publish to Maven Central (Note: **We could get rid of this whole section by publishing binaries to npm instead**):
  - Log into Sonatype and go to [Staging upload](https://oss.sonatype.org/#staging-upload). You'll need to get permissions for this by filing a ticket explaining you're a core contributor to React Native. [Example ticket](https://issues.sonatype.org/browse/OSSRH-11885).
  - Select Artifact(s) with a POM (to publish to a local Maven repo for testing run `./gradlew :ReactAndroid:installArchives`)
  - Add all files: .aar, sources jar, javadoc jar, .asc for everything (including the POM file)
  - Wait a few hours until you see the version has propagated to [JCenter](https://bintray.com/bintray/jcenter/com.facebook.react%3Areact-native/view)

To release to npm:

(You need to be a maintainer of the repo. For admins, here's the command to promote someone)

```
npm owner add <user> react-native
```

```
git tag v0.version_you_are_releasing.0-rc 0.version_you_are_releasing-stable # don't forget the `v` at the beginning!
git push --tags
```

- Publish to npm

```
npm set registry https://registry.npmjs.org/
npm publish
# *Only* when doing a non-rc release:
# npm dist-tag add react-native@0.non_rc_version.0 latest
```
- Upgrade tags to a release by going to https://github.com/facebook/react-native/tags
- Click "Add Notes to release"
- Click Publish

## Track bug reports from the community during the following two weeks and make sure they get fixed

A good way to do this is to create a github issue and post about it so people can report bugs: https://github.com/facebook/react-native/issues/5201
