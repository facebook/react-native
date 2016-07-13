---
id: packaging-a-ios-component
title: Packaging a ios component
layout: docs
category: Guides (iOS)
permalink: docs/packaging-a-ios-component.html
next: native-modules-android
---

You can also inject Native modules into react-native by creating a project in Objective-C and publish it as package in npm so that anyone can use it.

*Please proceed with the following steps.*
### Creating the package

* Create a new project, use this type of naming, React-native(RN) prefix.

![new-project](http://brentvatne.ca/images/packaging/1-new-project.png)
![new-project-2](http://brentvatne.ca/images/packaging/2-project-name.png)
**Note-**
*RN is a prefix mainly used to indicate that it is a
react-native standard library, feel free to adopt it or use your
own*

 * `cd` to the project directory and run `npm init`, fill out your information.

![npm-init](http://brentvatne.ca/images/packaging/3-npm-init.png)

 * `npm install react-native --save-dev`, then open up `package.json`
   and also add  peerDependencies: { "react-native": "*" }.

 * Now we need to tell XCode where it can find the React Native source. Open up the project, add React to your Header Search Paths.

![header-paths](http://brentvatne.ca/images/packaging/4-header-search-paths.png)
![header-paths-2](http://brentvatne.ca/images/packaging/5-header-search-paths.png)

 * The highlighted one is for development, the one above it (`$(SRCROOT)/../react-native/React`) is so that we can find the source when this library is installed into the `node_modules` directory of another project.

 * Make a copy  of  all your source files  and make sure they're listed in compile sources.

![compile-sources](http://brentvatne.ca/images/packaging/6-compile-sources.png)

 * Add a good `.gitignore` (eg: [Github's Objective-C.gitignore](https://github.com/github/gitignore/blob/master/Objective-C.gitignore)) - don't forget to ignore `node_modules/**/*`.

 * Commit, tag it with the curent version `git tag 0.0.1`

 * Push to Github, publish on npm `git push origin head --tags && npm publish` (if you haven't published a npm module before, [check this out](https://gist.github.com/coolaj86/1318304)).

Great! You now have a package that you can share with your friends and
foes can install with a simple `npm install your-best-package-name`

### Using the package

*  `npm install your-package-name --save`

*  Add the library to your project and link it.

* The following gif will give you a clear idea.

![add-link](http://brentvatne.ca/images/packaging/7-add-link.gif)

Hope this is useful .Feel free to report  in our github [repo](https://github.com/facebook/react-native/issues)


-----------------------------------------------------------------------

