The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

Release schedule:

- **0.21 branch cut**, 0.21.0-rc - **week of Feb 15**
- 0.21.0 - Feb 29
- **0.22 branch cut**, 0.22.0-rc - **week of Feb 29**
- 0.22.0 - Mar 14
- **0.23 branch cut**, 0.23.0-rc - **week of Mar 14**
- 0.23.0 - Mar 28
- **0.24 branch cut**, 0.23.0-rc - **week of Mar 28**
- 0.24.0 - Apr 11
- ...

## One time setup

Set up Sinopia: https://github.com/facebook/react-native/tree/master/react-native-cli

## Cut a release branch

To cut a release branch and check that everything works, you'll need Mac OS with the [Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md).

Run:

    cd react-native
    ./scripts/release.sh version_you_are_releasing # e.g. ./scripts/release.sh 0.22

#### Check that everything works

Make absolutely sure a basic iOS and Android workflow works on the release branch you've just created, see the instructions printed by `release.sh`.
  
#### Push to github

  - Check git history, the last commit should be "[0.22-rc] Bump version numbers" (with the correct version)
  - `git push origin 0.version_you_are_releasing-stable  # e.g. git push origin 0.22-stable`

## Make sure we have release notes

Post that we're ready to release so a voluteer can write release notes:
https://github.com/facebook/react-native/releases

To go through all the commits that went into a release, one way is to use the GitHub compare view: https://github.com/facebook/react-native/compare/0.18-stable...0.19-stable

## Do an RC release (e.g. 0.22.0-rc)

IMPORTANT: `npm publish` will automatically set the latest tag. **When doing an RC release**, run `npm publish --tag next` - this way people need to opt in to get the RC release.

## IMPORTANT: Track bug reports from the community during the following two weeks and make sure they get fixed

A good way to do this is to create a github issue and post about it so people can report bugs. Examples: https://github.com/facebook/react-native/issues/6087, https://github.com/facebook/react-native/issues/5201

We should only be tracking bugs with small and non-risky fixes. Don't pick new features into the release as this greatly increases the risk of something breaking. The main point of the RC is to let people to use it for two weeks and fix the most serious bugs.

-------------------

## Do a release (e.g. 0.22.0, 0.22.1)

Roughly two weeks after the branch cut (see the release schedule above) it's time to promote the RC to a real realease.

Make sure you know which bug fixes should definitely be cheery-picked, example: https://github.com/facebook/react-native/issues/6087

We should only cherry-pick small and non-risky bug fixes. Don't pick new features into the release as this greatly increases the risk of something breaking. The main point of the RC is to let people to use it for two weeks and fix the most serious bugs.

Do the following:

**NOTE: Most of these steps are similar to what the script `release.sh` does. The script is used to cut the release branch only, can be made more generic to help with this step too.**

```
cd react-native
git checkout master
git pull
git checkout 0.version_you_are_releasing-stable   # e.g. git checkout 0.22-stable
git pull origin 0.version_you_are_releasing-stable  # e.g. git pull origin 0.22-stable
# Cherry-pick those commits, test everything again using Sinopia
git cherry-pick commitHash1
# Create the 'android' folder to be published to npm.
./gradlew :ReactAndroid:installArchives
# Check that it's there: `ls android`
...
npm set registry http://localhost:4873
sinopia
# change versions in package.json and React.podspec
npm publish
cd /tmp
react-native init TestAapp
cd TestApp
react-native run-ios
# Check that you can Reload JS and the Chrome debugger works
# Kill packager
open ios/TestApp.xcodeproj
# Click run
# Check that you can Reload JS and the Chrome debugger works
cd android && ./gradlew dependencies
# Double check the react-native dep has the correct version
cd ..
react-native run-android
# Check that you can Reload JS and the Chrome debugger works
```

If everything worked:

```
npm set registry https://registry.npmjs.org
npm publish
```

Tag the release in Git:

```
git tag v-version_you_are_releasing  # e.g. git tag v0.22.0, git tag v0.22.1
git push --tags
```

To update the [website](https://facebook.github.io/react-native), move the `latest` tag and push to the `0.x-stable` branch. CircleCI will build and deploy the latest docs to the website.

```
git tag -d latest
git push origin :latest
git tag latest
git push origin version_you_are_releasing-stable --tags  # e.g git push origin 0.22-stable --tags
```

Once you see the version in the top left corner of the website has been updated:
Move the release notes to the tag you've just created. We want single release notes per version, for example if there is v0.22.0-rc and later we release v0.22.0, the release notes should live on v0.22.0:
https://github.com/facebook/react-native/tags

Uncheck the box "This is a pre-release" and publish the notes.

Tweet about it! :) ([example tweet](https://twitter.com/grabbou/status/701510554758856704))
