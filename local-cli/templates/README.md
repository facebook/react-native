# App templates

This folder contains basic app templates. These get expanded by 'react-native init' when creating a new app to make it easier for anyone to get started.

# Chat Example

This is an example React Native app demonstrates ListViews, text input and
navigation between a few screens.

<img width="487" alt="screenshot 2017-01-13 17 24 37" src="https://cloud.githubusercontent.com/assets/346214/21950983/54d75cb4-d9b5-11e6-9d63-bd7edf51f4d4.png">
<img width="487" alt="screenshot 2017-01-13 17 24 40" src="https://cloud.githubusercontent.com/assets/346214/21950982/54d6797a-d9b5-11e6-829f-3e0f15dab0c1.png">

## Purpose

One problem with React Native is that it is not trivial to get started: `react-native init` creates a very simple app that renders some text. Everyone then has to figure out how to do very basic things such as adding a list of items fetched from a server, navigating to a screen when a list item is tapped, or handling text input.

This app is a template used by `react-native init` so it is easier for anyone to get up and running quickly by having an app with a few screens, a `ListView` and a `TextInput` that works well with the software keyboard.

## Best practices

Another purpose of this app is to define best practices such as:
- The folder structure of a standalone React Native app
- A style guide for JavaScript and React - for this we use the [AirBnb style guide](https://github.com/airbnb/javascript)
- Naming conventions

We need your feedback to settle on a good set of best practices. Have you built React Native apps? If so, please use the issues in the repo [mkonicek/ChatExample](https://github.com/mkonicek/ChatExample) to discuss what you think are the best practices that this example should be using.

## Running the app locally

```
cd ChatExample
yarn
react-native run-ios
react-native run-android
```

--- 
(In case you want to use react-navigation master):

```
# Install dependencies:
cd react-navigation
yarn
yarn pack --filename react-navigation-1.0.0-alpha.tgz
cd ChatExample
yarn
yarn add ~/code/react-navigation/react-navigation-1.0.0-alpha.tgz
```
