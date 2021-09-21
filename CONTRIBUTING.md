# Contributing to microsoft/react-native-macos

This document describes how to set up your development environment and contribute changes to the **microsoft/react-native-macos** project. This is a working fork of **facebook/react-native** where changes for supporting macOS are being staged. 
> **Note: This repository will be accepting PRs only specific to macOS support. To contribute to React Native, please see [Contributing to react-native](https://github.com/facebook/react-native/blob/master/CONTRIBUTING.md)**

This document assumes basic working knowledge with Git and related tools. We are providing instructions specific to this project. You can either do this with the command prompt or with a combination of the command prompt and [**SourceTree**](https://www.sourcetreeapp.com/). 

## Setting up your branch for changes 

### Creating your own fork

If you wish to contribute changes back to the **microsoft/react-native-macos** repository, start by creating your own fork of the repository. This is essential. This will keep the number of branches on the main repository to a small count. There are lots of developers in this project and creating lots of branches on the main repository does not scale. In your own fork, you can create as many branches as you like.

- Navigate to **[GitHub](https://www.github.com)** with a browser and log in to your GitHub account. For the sake of this document, let's assume your username is **johndoe**.
- Navigate to the **[microsoft/react-native-macos](https://github.com/microsoft/react-native-macos)** repository in the same browser session.
- Click on the **Fork** button at the top right corner of the page.
- Create the fork under your account. Your GitHub profile should now show **react-native-macos** as one of your repositories.
- Create a folder on your device and clone your fork of the **Microsoft** repository. e.g. `https://github.com/johndoe/react-native-macos.git`. Notice how your GitHub username is in the repository location.

```bash
git clone https://github.com/johndoe/react-native-macos.git
```

### Setting up the upstream repository

Before starting to contribute changes, please setup your upstream repository to the primary **microsoft/react-native-macos** repository.

- When you run `git remote -v`, you should see only your fork in the output list

```bash
git remote -v

     origin  https://github.com/johndoe/react-native-macos.git (fetch)
     origin  https://github.com/johndoe/react-native-macos.git (push)
```

- Map the primary **react-native-macos** repository as the upstream remote

```bash
git remote add upstream https://github.com/microsoft/react-native-macos.git
```

- Now running `git remote -v` should show the upstream repository also

```bash
git remote -v

     origin  https://github.com/johndoe/react-native-macos.git (fetch)
     origin  https://github.com/johndoe/react-native-macos.git (push)
     upstream        https://github.com/microsoft/react-native-macos.git (fetch)
     upstream        https://github.com/microsoft/react-native-macos.git (push)
```

- At this point you are ready to start branching and contributing back changes.

### Setting up the branch

For each bug or task you complete, it is recommended that you start with a fresh branch. If you have any lingering changes in your current branch that you want to save, go ahead and commit them. If you are just beginning, then you are good to go. On github, navigate to your repository which should be forked from **microsoft/react-native-macos** as described in the above sections. Above the list of files is a dropdown that should say master. Use the dropdown to create a new branch and name is according to what you will be working on. (I.e. DropdownHighlight, CleanUpExamples, etc). Now you have created a new branch. 

**SourceTree:**
If you are using SourceTree you will want your branch to show up in SourceTree so you can commit changes to your branch. It takes time for it to show up automatically, so you can make it show by running `git pull --all` in your command prompt from the root. Once you see your new branch in SourceTree under Remotes on the left navigation pane, double click on your branch to check it out locally. A dialog will come up and the default settings should be fine, click Ok.  

**Git Command Line**
If you are using the command line, you will want to make sure you have your branch locally. It takes time for it to show up automatically, so you can make it show by running `git pull --all` in your command prompt from the root. Run `git branch -a` to see if your new branch shows up. Now you will want to check out your branch locally. You can do this with `git checkout -b branch-name`. Confirm you are now working out of the branch with `git branch`.

### Merging upstream master into your fork master

From time to time, your fork will get out of sync with the upstream remote. Use the following commands to get the master branch of your fork up up to date.

```bash
git fetch upstream
git checkout master
git pull upstream master
git push
```

### Merging upstream master into your current branch

Use these commands instead if you would like to update your *current* branch in your fork from the upstream remote.

```bash
git fetch upstream
git pull upstream master
git push
```
## Contributing

### Building the Repository
This repo uses `yarn` to manage its dependencies so to pull in all the dependencies we need, you must run `yarn` from root (note this maps to `yarn install`).
 
`pod install` generates an `xcworkspace` from the existing `xcodeproj` and newly installed depedencies. Use the machine specific steps below to install your pods. Then to begin your work, launch the `RNTester.xcworkspace` project, choose your target of macOS or iOS and hit `Run`.

#### x86_64
After doing so, you now have all the repo-level dependencies, but you still need to pull in the specific macOS/iOS xcode project dependencies. We use Cocoapods for this and to install them you must cd into the directory (e.g. `cd projects/rn-tester`)and run `pod install`.
 
#### arm64
To install cocoapods on an `M1` machine, `pod install` won't work as of writing this (July 23, 2021). Run the commands below to set up your pods xcworkspace.
```
cd packages/rn-tester
sudo arch -x86_64 gem install ffi
sudo xcode-select -s /Applications/Xcode.app
arch -x86_64 pod install
```

### Make the fix
Now that your branch is set up and ready for commits, go ahead and fix the bug you are working on or make some small change that you want to check in. 
 
### Verify your changes
Manually test your fix by running RNTester. Run Unit Tests and Integration Tests in the RNTesterPods Xcode project. The following automated tests will be run as part of CI, you can also verify manually before submitting a PR.

```bash
yarn test # run jest tests on JavaScript
yarn lint # run eslint on JavaScript
yarn flow-check-macos # run Flow checks on JavaScript
```

### Commit your changes

**SourceTree:**
In SourceTree, click on commit in the top left. This won't actually do anything to your files, it will just change to show the commit UI. In the bottom container, stage all of the files you want to submit by selecting them and clicking "Stage". Add a short message in the textbox at the bottom on what is included in your change. This will not show as your entire submission text, just for this commit. 
 
**Git Command Line**
To stage files using the command line, you need to run `git add MyFileOne.tsx` for each file. You can also look up how to add all files with changes under a directory. Next you will want to commit changes with `git commit –m "This change updates the padding in the dropdown"`

You can commit multiple times until you are ready to make a pull request. You should keep the message short since it will not be used in the bug notes and is just for keeping track of the multiple commits in one pull request. 
 
### Provide changelog information
Run `yarn change` in the root of the repo.

### Create a Pull Request

**SourceTree:**
In SourceTree click Push.

**Git Command Line**
Run `git push`. 

This will push any staged files you have in your branch.
 
Now go back to your fork on github. You should see a yellow bar at the top with your change and a button that says "Compare & Pull Request". Click that button. 

Click "Create Pull Request".

A bunch of tests will automatically kick off to verify your PR.  The tests marked as `required` must pass before a PR can be merged.  

Someone will also have to review your change before the change is allowed to be merged in. They may ask questions for more information or ask you to change things. Be sure to respond to their comments and push additional changes to the branch if they ask you to modify things before they sign off.

Once you are happy with the changes, and want to merge them to the main **microsoft/react-native-macos** project, create a pull request from your branch directly to **microsoft/react-native-macos master**.

Members on the **microsoft/react-native-macos** core team will help merge your changes.

Now you are done! Celebrate!
