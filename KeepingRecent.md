
# Keeping Recent on Facebook's Changes

We aim to keep this forked repository as up to date as possible with [Facebook's repository](https://github.com/facebook/react-native). This document explains guidelines and responsibilities for pulling in the newest changes with the eventual goal of pushing all our changes back to Facebook and the React-Native-Community repos and deforking.

## Merging a New Version of React Native
1. Create a reference to a remote to Facebook's repo
    1. In terminal: `git remote add facebook https://github.com/facebook/react-native.git`
    2. In terminal: `cd react-native/; git pull facebook`
2.  Create a branch to work in. Below is for merging in Facebook's React Native 0.58 version. 
    1. In terminal: e.g. `git branch fb58merge`
    2. In terminal: e.g. `git checkout fb58merge`
3.  Pull the fb contents at the merge point we want. A list of their most recent versions can be found [here](https://facebook.github.io/react-native/versions).
    1.  In terminal: e.g. `git fetch facebook v0.58.6`
4.  Do the merge at the point we want, in this example it's the last version tag of their 0.58 build. Use the name you used in 3.1 here.
    1.  In terminal: e.g. `git merge v0.58.6`

## Integration Guidelines
It's likely you'll want to push the initial merge up to github **with** the merge conflicts. This makes it easier for other people to see where the errors are and help fix their platforms quickly.

1.  Commit all the changes (conflicts and all). There are many resources to do this such as the [Visual Studio Code](https://code.visualstudio.com/) UI or command line.
2.  After you've committed all the changes, push your merge up.
    1.  In terminal: `git push`. This should fail to push, but print out a suggested `git push [more repo specifics here]` command.
    2. Copy and run that suggested push command which has the proper upstream repo specified.

#### First Time Merging? Read Below. Otherwise this shouldn't apply to you.
3.  The first time doing this, terminal may ask for your github credentials after running the `git push` command from 2.2. You'll need to provide your github username and a 2-Factor-Authentication token password. If you don't have this yet, see substeps below. <em>Github doesn't distinguish when you need to use your github password vs. this 2FA token, but for command line github interactions, you'll need to use the token.</em>
    1.  Generate your personal access token [here](https://github.com/settings/tokens)
    2.  More details [here](https://stackoverflow.com/questions/29297154/github-invalid-username-or-password)

## Best Practices
* Before pulling in a new React-Native version, verify with platform owners that they're ready to work on the merge.
	* Why?
		* This prevents merges from getting stuck in limbo where some platforms aren't done for multiple months and in the meantime we have to maintain two working branches. Faster we merge from start to finish, the exponentially less pain we incur.
	* Platform owners
		* Win32- acoates-ms
		* Android- acoates-ms
		* iOS- HeyImChris/tom-un
		* Mac- HeyImChris/tom-un
* Make sure you're pulling in a **stable** [release candidate](https://facebook.github.io/react-native/versions).
