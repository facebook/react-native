The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

Release schedule:

- **0.22 branch cut**, 0.22.0-rc - **week of Mar 7**
- 0.22.0 - Mar 21
- **0.23 branch cut**, 0.23.0-rc - **week of Mar 21**
- 0.23.0 - Apr 4
- **0.24 branch cut**, 0.24.0-rc - **week of Apr 4**
- 0.24.0 - Apr 18
- **0.25 branch cut**, 0.25.0-rc - **week of Apr 18**
- 0.25.0 - May 2
- **0.26 branch cut**, 0.26.0-rc - **week of May 2**
- 0.26.0 - May 16
- **0.27 branch cut**, 0.27.0-rc - **week of May 16**
- 0.27.0 - May 30
- ...

-------------------

## How to cut a new release branch

#### Check everything works

Make absolutely sure a basic iOS and Android workflow works on the commit you are going to use for release.
Make sure CI systems [Travis](https://travis-ci.org/facebook/react-native) and [Circle](https://circleci.com/gh/facebook/react-native)
are green and then run

```
./scripts/test-manual-e2e.sh
```

This script runs end to end with a proxy npm repository on local PC and asks to check that Chrome Debugging works.

#### Cut a release branch and push to github

To cut a release branch and check that everything works, you'll need Mac OS with the
[Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md).

Run:

```
git checkout -b <version_you_are_releasing>-stable # e.g. git checkout -b 0.22-stable
node ./scripts/bump-oss-version.js <exact-version_you_are_releasing> # e.g. git node ./scripts/bump-oss-version.js 0.22.0-rc
# IMPORTANT: Test everything (Chrome debugging, Reload JS, Hot Module Reloading)
./scripts/test-manual-e2e.sh
git push origin <version_you_are_releasing>-stable --tags # e.g. git push origin 0.22-stable --tags
```

Circle CI will run the tests and publish to npm with version `0.22.0-rc` and tag `next` meaning that
this version will not be installed for users by default.

Go to [Circle CI](https://circleci.com/gh/facebook/react-native), look for your branch on the left side and look the npm publish step.

**Note** In order for the CI to publish to npm the **last** commit on the new branch must have the tag `v<branch-name-without-stable>.0-[rc]`.

#### Make sure we have release notes

Write the release notes, or post in [React Native Core Contributors](https://www.facebook.com/groups/reactnativeoss/) that the RC is ready to find a voluteer.

To go through all the commits that went into a release, one way is to use the GitHub compare view: https://github.com/facebook/react-native/compare/0.21-stable...0.22-stable (Note: This only shows **250** commits, if there are more use git.)

Post the release notes: https://github.com/facebook/react-native/releases

#### Tweet about the rc release

Tweet about it! Link to release notes and say "please report issues" and link to the master issue to track bugs you created.

## IMPORTANT: Track bug reports from the community during the following two weeks, ping owners to get them fixed

A good way to do this is to create a github issue and post about it so people can report bugs. Examples: https://github.com/facebook/react-native/issues/6087, https://github.com/facebook/react-native/issues/5201

**Only cherry-pick small and non-risky bug fixes**. **Don't pick new features into the release** as this greatly increases the risk of something breaking. The main point of the RC is to let people to use it for two weeks and fix the most serious bugs.

-------------------

## How to release an RC update (e.g. 0.22.0-rc1, 0.22.0-rc2)

After cherry-picking 1-2 bug fixes, it is a good idea to do a new RC release so that people can test again. Having a few RC releases can also help people bisect in case we cherry-pick a bad commit by mistake.

```
git checkout 0.version_you_are_releasing-stable   # e.g. git checkout 0.22-stable
git pull origin 0.version_you_are_releasing-stable  # e.g. git pull origin 0.22-stable
# Cherry-pick those commits
git cherry-pick commitHash1

# IMPORTANT: Test everything again (Chrome debugging, Reload JS, Hot Module Reloading)
./scripts/test-manual-e2e.sh
```

If everything worked:

```
node ./scripts/bump-oss-version.js <exact_version_you_are_releasing> # e.g. node ./scripts/bump-oss-version.js 0.22.0-rc1
git push origin version_you_are_releasing-stable --tags  # e.g. git push origin 0.22-stable --tags
````

-------------------

## How to do the final release (e.g. 0.22.0, 0.22.1)

Roughly two weeks after the branch cut (see the release schedule above) it's time to promote the last RC to a real release.

Once all bugfixes have been cherry-picked and you're sure the release is solid (example: https://github.com/facebook/react-native/issues/6087), do the release:

```
git checkout 0.version_you_are_releasing-stable   # e.g. git checkout 0.22-stable
git pull origin 0.version_you_are_releasing-stable  # e.g. git pull origin 0.22-stable
# Cherry-pick those commits, if any
git cherry-pick commitHash1

# IMPORTANT: If you cherry-picked any commits, test everything again (Chrome debugging, Reload JS, Hot Module Reloading)
./scripts/test-manual-e2e.sh
```

If everything worked:

```
node ./scripts/bump-oss-version.js <exact_version_you_are_releasing> # e.g. node ./scripts/bump-oss-version.js 0.22.0
git tag -d latest
git push origin :latest
git tag latest # The latest tag marks when to regenerate the website.
git push origin version_you_are_releasing-stable --tags  # e.g. git push origin 0.22-stable --tags
```

#### Update the release notes

Once you see the version in the top left corner of the website has been updated:
Move the release notes to the tag you've just created. We want single release notes per version,
for example if there is v0.22.0-rc and later we release v0.22.0, the release notes should live on v0.22.0:
https://github.com/facebook/react-native/tags

For non-RC releases: Uncheck the box "This is a pre-release" and publish the notes.

#### Tweet about it

Tweet about it! :) ([example tweet](https://twitter.com/grabbou/status/701510554758856704))
