---
id: packaging-a-RNComponent-ios
title: Packaging a react-native component
layout: docs
category: Guides (iOS)
permalink: docs/packaging-a-RNComponent-ios.html
next: native-modules-android
---

After you've written some code in an existing project and it works great
and you want to pull it out into its own package, put it on npm, then
install it back into your project. But wait, your component is partially
implemented in Objective-C! How can you share this on `npm`? 
Please read the following steps
### Creating the package

1. Create a new project, use this type of naming, RN prefix.

![new-project](http://brentvatne.ca/images/packaging/1-new-project.png)
![new-project-2](http://brentvatne.ca/images/packaging/2-project-name.png)
**RN is a prefix that I have been using as RCT should only be used for
the react-native standard library, feel free to adopt it or use your
own**

2. `cd` to the project directory and run `npm init`, fill out your info!

![npm-init](http://brentvatne.ca/images/packaging/3-npm-init.png)

3. `npm install react-native --save-dev`, then open up `package.json`
   and also add the same version to `peerDependencies`.

4. Now we need to tell XCode where it can find the React Native source. Open up the project, add React to your Header Search Paths.

![header-paths](http://brentvatne.ca/images/packaging/4-header-search-paths.png)
![header-paths-2](http://brentvatne.ca/images/packaging/5-header-search-paths.png)

The highlighted one is for development, the one above it (`$(SRCROOT)/../react-native/React`) is so that we can find the source when this library is installed into the `node_modules` directory of another project.

5. Copy all of your source files in and make sure they're listed in compile sources.

![compile-sources](http://brentvatne.ca/images/packaging/6-compile-sources.png)

5. Add a good `.gitignore` (eg: [Github's Objective-C.gitignore](https://github.com/github/gitignore/blob/master/Objective-C.gitignore)) - don't forget to ignore `node_modules/**/*`.

6. Commit, tag it with the curent version `git tag 0.0.1`

7. Push to Github, publish on npm `git push origin head --tags && npm publish` (if you haven't published a npm module before, [check this out](https://gist.github.com/coolaj86/1318304)).

Great! You now have a package that you can share with your friends and
foes can install with a simple `npm install your-best-package-name`

### Using the package

1. `npm install your-package-name --save`

2. Add the library to your project and link it (gif below will be useful)

![add-link](http://brentvatne.ca/images/packaging/7-add-link.gif)

### A note about development workflow

This is all great if you already have a project done and are never going
to change it again. The above techniques are crude but effective: You can  modify the
existing version of the package inside of the `node_modules` directory
of an example project where you can use it, and then when you're done you should copy
and paste the files back into the git repo, tag commit and push. You've
heard that `npm link local/file/path` or `npm install local/file/path`
works for some, whatever you prefer here!

-----------------------------------------------------------------------

So this solution is far from ideal, but [discussions are taking
place](https://github.com/facebook/react-native/issues/235) and
[progress is being
made](https://github.com/ReactExtensionManager/ReactExtensionManager)
towards a better solution. Until then, hopefully the above instructions
will help you share your modules!