# App template for new React Native apps

This is a simple React Native app template which demonstrates a few basics concepts such as navigation between a few screens, FlatLists, and handling text input.

<img src="https://cloud.githubusercontent.com/assets/346214/22697898/ced66f52-ed4a-11e6-9b90-df6daef43199.gif" alt="Android Example" height="800" style="float: left"/>

<img src="https://cloud.githubusercontent.com/assets/346214/22697901/cfeab3e4-ed4a-11e6-8552-d76585317ac2.gif" alt="iOS Example" height="800"/>

## Purpose

The idea is to make it easier for people to get started with React Native. Currently `react-native init` creates a very simple app that contains one screen with static text. Everyone new to React Native then needs to figure out how to do very basic things such as:
- Rendering a list of items fetched from a server
- Navigating between screens
- Handling text input and the software keyboard

This app serves as a template used by `react-native init` so it is easier for anyone to get up and running quickly by having an app with a few screens and a FlatList ready to go.

### Best practices

Another purpose of this app is to define best practices such as the folder structure of a standalone React Native app and naming conventions.

## Not using Redux

This template intentionally doesn't use Redux. After discussing with a few people who have experience using Redux we concluded that adding Redux to this app targeted at beginners would make the code more confusing, and wouldn't clearly show the benefits of Redux (because the app is too small). There are already a few concepts to grasp - the React component lifecycle, rendering lists, using async / await, handling the software keyboard. We thought that's the maximum amount of things to learn at once. It's better for everyone to see patterns in their codebase as the app grows and decide for themselves whether and when they need Redux. See also the post [You Might Not Need Redux](https://medium.com/@dan_abramov/you-might-not-need-redux-be46360cf367#.f3q7kq4b3) by [Dan Abramov](https://twitter.com/dan_abramov).

## Not using Flow (for now)

Many people are new to React Native, some are new to ES6 and most people will be new to Flow. Therefore we didn't want to introduce all these concepts all at once in a single codebase. However, it might make sense to later introduce a separate version of this template that uses Flow annotations.

## Provide feedback

We need your feedback. Do you have a lot of experience building React Native apps? If so, please carefully read the code of the template and if you think something should be done differently, use issues in the repo [mkonicek/AppTemplateFeedback](https://github.com/mkonicek/AppTemplateFeedback) to discuss what should be done differently.

## How to use the template

```
$ react-native init MyApp --template navigation
$ cd MyApp
$ react-native run-android
$ react-native run-ios
```
