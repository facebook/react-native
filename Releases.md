The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

Future releases:

- **0.17 branch cut**, 0.17.0-rc - beginning of **week of Dec 7**
- 0.17.0 - Dec 17
- (Holiday break)
- **0.18 branch cut**, 0.18.0-rc - beginning of **week of Jan 4**
- 0.18.0 - Jan 14
- **0.19 branch cut**, 0.19.0-rc - beginning of **week of Jan 18**
- 0.19.0 - Jan 28
- ...

## Ideas for improvements

- A lot of these steps could be done by a script
- We could simplify the process quite a bit by publishing the Android binaries to npm. This will increase the size of the npm package by about 3.3MB. To do that: after `installArchives`, move the binaries to somewhere where `npm publish` will pick them up. Then, change the `build.gradle` file(s) of your generated app so that Gradle will pick up the binaries from `node_modules`.

## Cut a release branch

Note: Make sure you replace 0.18 in all the commands below with the version you're releasing :) For example, copy-paste all of this into an editor and replace 0.18.

#### Check that everything works

First, set up Sinopia (only need to do this once): https://github.com/facebook/react-native/tree/master/react-native-cli

Make absolutely sure basic iOS and Android workflow works on master:
  - `cd react-native`
  - `git pull`
  - `git checkout -b 0.18-stable`
  - Edit `ReactAndroid/gradle.properties`, set `VERSION_NAME=0.18.0`
  - Edit `ReactAndroid/release.gradle`, uncomment Javadoc generation (the line `// archives androidJavadocJar`)
  - Make sure `java -version` prints 1.7.x, this is currently needed for Javadoc generation and Javadocs are required by Maven Central (we should make it work with Java 8)
  - Run `./gradlew :ReactAndroid:installArchives`, it will print a lot of Javadoc warnings, that's OK.
  - Check the artifacts were generated: `ls -al ~/.m2/repository/com/facebook/react/react-native/0.18.0/` should contain:
    - `react-native-0.18.0-javadoc.jar`, `react-native-0.18.0-sources.jar`, `react-native-0.18.0.aar`, `react-native-0.18.0.pom`
    - For each of the above also `.asc` file
  - In `package.json`, set version to e.g. `0.18.0-rc`.
  - In `React.podspec`, set version to e.g. `0.18.0-rc`.
  - In `local-cli/generator-android/templates/src/app/build.gradle` update the dependency to e.g. `com.facebook.react:react-native:0.18.+`
  - Publish to sinopia:
    - `npm set registry http://localhost:4873/`, check that it worked: `npm config list` will show registry is set to localhost
    - In a separate shell, start sinopia. Run `sinopia`. If started successfully it will print: http address - http://localhost:4873/.
    - Make sure http://localhost:4873/ shows no old versions
    - `npm publish`
    - http://localhost:4873/ will show 0.18.0-rc
  - Test that everything works:
    - `cd /tmp`
    - `react-native init Zero12rc`
    - `cd Zero12rc`
    - Check that `package.json`, `android/app/build.gradle` have correct versions (`^0.18.0-rc`, `com.facebook.react:react-native:0.18.+`)
    - `open ios/Zero12rc.xcodeproj`
    - Hit the Run button in Xcode.
    - Packager should open in a new window, you should see the Welcome to React Native screen, Reload JS, try Chrome debugging - put a breakpoint somewhere in `index.ios.js` and Reload JS, Chrome debugger should stop on the breakpoint (we don't have tests for Chrome debugging)
    - Close the packager window, close Xcode
    - Start an Android emulator (ideally Genymotion, it's faster and more reliable than Google emulators)
    - `react-native run-android`
    - Test is the same way as on iOS, including Chrome debugging
  
#### Push to github

  - Revert the Javadoc change in `ReactAndroid/release.gradle`
  - `git commit -am "[0.18-rc] Bump version numbers"`
  - `git push origin 0.18-stable`

## Do a release

Publish to Maven Central (Note: **We could get rid of this whole section by publishing binaries to npm instead**):
  - Log into Sonatype and go to [Staging upload](https://oss.sonatype.org/#staging-upload). You'll need to get permissions for this by filing a ticket explaining you're a core contributor to React Native. [Example ticket](https://issues.sonatype.org/browse/OSSRH-11885).
  - Select Artifact(s) with a POM (to publish to a local Maven repo for testing run `./gradlew :ReactAndroid:installArchives`)
  - Add all files: .aar, sources jar, javadoc jar, .asc for everything (including the POM file)
  - Wait a few hours until you see the version has propagated to [JCenter](https://bintray.com/bintray/jcenter/com.facebook.react%3Areact-native/view)

To release 0.18-rc to npm:

(You need to be a maintainer of the repo. For admins, here's the command to promote someone)

```
npm owner add <user> react-native
```

```
git tag v0.18.0-rc 0.18-stable # don't forget the `v` at the beginning!
git push --tags
```

- Publish to npm

```
npm publish
# Only when doing a non-rc release:
npm dist-tag add react-native@0.18.0 latest
```
- Upgrade tags to a release by going to https://github.com/facebook/react-native/tags
- Click "Add Notes to release"
- Click Publish
