---
id: packaging-an-iOS-component
title: Packaging an iOS component
layout: docs
category: Guides (iOS)
permalink: docs/packaging-an-iOS-component.html
next: native-modules-android
---

You can also inject native modules into React Native by creating a project in Objective-C and publish it as npm package.

### Creating the package

 * Create a new Xcode project and fill out the product name, organization name and organization identifier. Ensure that the name of your project is prefixed with RN.

 * `RN` is a prefix mainly used to indicate that it is a
react-native standard library.It is not required, but it is encouraged.

 * `cd` to the project directory and run `npm init` and fill out your information such as package-name,version and so on.

 * `npm install react-native --save-dev`, then open up `package.json`
   and  add  `peerDependencies: { "react-native": "*" }`.

 * Now we need to tell Xcode where it can find the React Native source. Open up the project, add React to your Header Search Paths.

![header-paths-2](img/5-header-search-paths.png)

 * The highlighted one is for development.The package will be available in `node_modules` directory of the project that is published as a package.We have to add that package to the new project and link it.

 * Make a copy of all your source files and make sure they are listed in project's build phases of compile sources.

 * Add a good `.gitignore` (eg: [Github's Objective-C.gitignore](https://github.com/github/gitignore/blob/master/Objective-C.gitignore)) - don't forget to ignore `node_modules/**/*`.

 * Commit, tag it with the curent version ` eg :git tag 0.0.1`

 * Push to Github, publish on npm `git push origin head --tags && npm publish` (if you haven't published a npm module before, [check this out](https://gist.github.com/coolaj86/1318304)).

Great! You now have a package  that can be used publicly by calling  `npm install your-best-package-name`

### Using the package

* `npm install your-package-name --save`

* Add the library to your project and link it.

* The following gif will give you a clear idea.

![add-link](img/7-add-link.gif)

Hope this is useful .Feel free to report  in our github [repo](https://github.com/facebook/react-native/issues)


-----------------------------------------------------------------------

