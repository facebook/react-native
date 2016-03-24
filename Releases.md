The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

Release schedule:

- **0.21 branch cut**, 0.21.0-rc - **week of Feb 15**
- 0.21.0 - Feb 29
- **0.22 branch cut**, 0.22.0-rc - **week of Mar 7**
- 0.22.0 - Mar 21
- **0.23 branch cut**, 0.23.0-rc - **week of Mar 21**
- 0.23.0 - Apr 4
- **0.24 branch cut**, 0.23.0-rc - **week of Apr 4**
- 0.24.0 - Apr 18
- ...

#### Check that everything works

Make absolutely sure a basic iOS and Android workflow works on the commit you are going to use for release.
Make sure CI systems [Travis](https://travis-ci.org/facebook/react-native) and [Circle](https://circleci.com/gh/facebook/react-native)
are green and then run

```
./scripts/test-manual-e2e.sh
```

This script runs end to end with a proxy npm repository on local PC and asks to check that Chrome Debugging works.

## Cut a release branch and push to github

To cut a release branch and check that everything works, you'll need Mac OS with the
[Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md).

Run:

```
git checkout -b <version_you_are_releasing>-stable # e.g. git checkout -b 0.22-stable
git tag v<version_you_are_releasing>.0-rc # e.g. git tag v0.22.0-rc
git push origin <version_you_are_releasing>-stable --tags # e.g. git push origin 0.22-stable --tags
```

Circle CI will run the tests and publish to npm with version `0.22.0-rc` and tag `next` meaning that
this version will not be installed for users by default.

Go to [Circle CI](https://circleci.com/gh/facebook/react-native), look for your branch on the left side and look the npm publish step.

** Note ** CI won't publish to npm if the `last` commit on the new branch does not have a tag `v<branch-name-without-stable>.0-[rc]`.

## Make sure we have release notes

Post that we're ready to release so a voluteer can write release notes:
https://github.com/facebook/react-native/releases

To go through all the commits that went into a release, one way is to use the GitHub compare view: https://github.com/facebook/react-native/compare/0.21-stable...0.22-stable

## IMPORTANT: Track bug reports from the community during the following two weeks and make sure they get fixed

A good way to do this is to create a github issue and post about it so people can report bugs. Examples: https://github.com/facebook/react-native/issues/6087, https://github.com/facebook/react-native/issues/5201

We should only be tracking bugs with small and non-risky fixes. Don't pick new features into the release as this greatly increases the risk of something breaking. The main point of the RC is to let people to use it for two weeks and fix the most serious bugs.

-------------------

## Do a release (e.g. 0.22.0, 0.22.1)

Roughly two weeks after the branch cut (see the release schedule above) it's time to promote the RC to a real release.

Make sure you know which bug fixes should definitely be cheery-picked, example: https://github.com/facebook/react-native/issues/6087

We should only cherry-pick small and non-risky bug fixes. Don't pick new features into the release as this greatly increases the risk of something breaking. The main point of the RC is to let people to use it for two weeks and fix the most serious bugs.

Do the following:


```
git checkout 0.version_you_are_releasing-stable   # e.g. git checkout 0.22-stable
git pull origin 0.version_you_are_releasing-stable  # e.g. git pull origin 0.22-stable
# Cherry-pick those commits
git cherry-pick commitHash1

# test everything again
./scripts/test-manual-e2e.sh

# Check that you can Reload JS and the Chrome debugger works
```

If everything worked:

```
git tag v-version_you_are_releasing  # e.g. git tag v0.22.0, git tag v0.22.1
git tag -d latest
git push origin :latest
git tag latest # for docs [website](https://facebook.github.io/react-native) to be generated
git push origin version_you_are_releasing-stable --tags  # e.g. git push origin 0.22-stable --tags
```

Once you see the version in the top left corner of the website has been updated:
Move the release notes to the tag you've just created. We want single release notes per version,
for example if there is v0.22.0-rc and later we release v0.22.0, the release notes should live on v0.22.0:
https://github.com/facebook/react-native/tags

Uncheck the box "This is a pre-release" and publish the notes.

Tweet about it! :) ([example tweet](https://twitter.com/grabbou/status/701510554758856704))
