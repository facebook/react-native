The list of releases with notes can be found at:
https://github.com/facebook/react-native/releases

Future releases:

- **0.20 branch cut**, 0.20.0-rc - **week of Feb 1**
- 0.20.0 - Feb 15
- **0.21 branch cut**, 0.21.0-rc - **week of Feb 15**
- 0.21.0 - Feb 29
- **0.22 branch cut**, 0.22.0-rc - **week of Feb 29**
- 0.22.0 - Mar 7
- **0.23 branch cut**, 0.23.0-rc - **week of Mar 7**
- 0.23.0 - Mar 21
- ...

## One time setup

Set up Sinopia: https://github.com/facebook/react-native/tree/master/react-native-cli

## Cut a release branch

To cut a release branch and check that everything works, you'll need Mac OS with the [Android dev environment set up](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md).

Run:

    cd react-native
    ./scripts/release.sh 0.19   # Replace 0.19 with the version you're cutting the branch for :)

#### Check that everything works

Make absolutely sure a basic iOS and Android workflow works on the release branch you've just created, see the instructions printed by `release.sh`.
  
#### Push to github

  - Check git history, the last commit should be "[0.19-rc] Bump version numbers" (with the correct version)
  - `git push origin 0.version_you_are_releasing-stable`
  
## Make sure we have release notes

Post that we're ready to release so voluteers can write release notes:
https://github.com/facebook/react-native/releases

To go through all the commits that went into a release, one way is to use the github compare view: https://github.com/facebook/react-native/compare/0.18-stable...0.19-stable

## Do a release

IMPORTANT:  `npm publish` will automatically set the latest tag. **When doing an RC release**, run `npm publish --tag next` - this way people need to opt in to get the RC release.

## Track bug reports from the community during the following two weeks and make sure they get fixed

A good way to do this is to create a github issue and post about it so people can report bugs: https://github.com/facebook/react-native/issues/5201
