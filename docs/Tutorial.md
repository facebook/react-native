---
id: tutorial
title: Tutorial
layout: docs
category: Tutorial
permalink: docs/tutorial.html
next: videos
---

## Preface

This is a tutorial that aims to get you up to speed with writing iOS apps using React Native. If you want to learn what React Native is and why Facebook built it, check out this blog post: **[INSERT BLOG POST URL]**.

We assume you have experience writing websites with ReactJS. If not, you can learn about ReactJS [here](http://facebook.github.io/react/).


## Setup

React Native has a few requirements which you can find on the [github page](https://github.com/facebook/react-native#requirements) (specifically OSX, Xcode, Homebrew, node, npm, watchman, and (optionally) flow)

After installing these dependencies there are two simple commands to get a React Native project all set up for development.

1. `npm install -g react-native-cli`

    `react-native-cli` is a command line interface that does the rest of the set up. It’s also an npm module so you can get it very easily. This will install `react-native-cli` so you can run it as a command in your terminal. You only need to do this once ever.

2. `react-native init AwesomeProject`

    This command fetches the React Native source code, installs all of the other npm modules that it depends on, and creates a new Xcode project in `AwesomeProject/AwesomeProject.xcodeproj`.


## Development

You can now open this new project (`AwesomeProject/AwesomeProject.xcodeproj`) in Xcode and simply build and run it with cmd+R. Doing so will start a node server which enables live code reloading by packaging and serving the latest JS bundle to the simulator at runtime. From here out you can see your changes by pressing cmd+R in the simulator rather than recompiling in Xcode.

For this tutorial let’s build a simple version of the Movies app that fetches 25 movies in theater and displays them in a ListView.


### Hello World

`react-native init` will copy `Examples/SampleProject` to whatever you named your project, in this case AwesomeProject. This is a simple hello world app. You can edit `index.ios.js` to make changes to the app and then press cmd+r in the simulator to see your changes.


### Fetching Data

The code below is a slightly modified version of the SampleApp that fetches the data we’ll need to build our application. The data fetching code isn’t really relevant to learning React Native so don’t worry too much about that but the rest of the app is very well documented.

```javascript
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  StyleSheet,
  Text,
  View,
} = React;

// The fetch module is used to make an HTTP request to rotten tomatoes's API
var fetch = require('fetch');

// This builds REQUEST_URL which is the URL we request data with
var API_KEY = '7waqfqbprs7pajbz28mqf6vz';
var API_URL = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
var PAGE_SIZE = 25;
var PARAMS = '?apikey=' + API_KEY + '&page_limit=' + PAGE_SIZE;
var REQUEST_URL = API_URL + PARAMS;

var SampleApp = React.createClass({
  // We initialize our state to {movies: null} so that we can check
  // this.state.movies === null to determine whether the movies data has been
  // loaded or not. Once they have we can do this.setState({movies: data}).
  getInitialState: function() {
    return {
      movies: null,
    };
  },

  // componentDidMount is called after the React compnent has loaded, this
  // calls this.fetchData to kick off the request for movies data
  componentDidMount: function() {
    this.fetchData();
  },

  // Here we're actually making the request and then handling the response by
  // doing this.setState({movies: moviesData}). this.setState causes the
  // component to re-render. In the render function below, the movies data will
  // then be available via this.state.movies.
  fetchData: function() {
    fetch(REQUEST_URL)
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          movies: responseData.movies,
        });
      })
      .done();
  },

  // This is pretty simple. If we don't have any movies data then render the
  // loading view. Otherwise, render the movies (placeholder for now).
  render: function() {
    if (!this.state.movies) {
      return this.renderLoading();
    }

    return (
      <View style={styles.container}>
        <Text>
          Movies loaded
        </Text>
      </View>
    );
  },

  // This is what the loading view looks like, simply some centered Text that
  // says "Loading movies...".
  renderLoading: function() {
    return (
      <View style={styles.container}>
        <Text>
          Loading movies...
        </Text>
      </View>
    );
  },
});

// This is what styles our views. Setting flex to 1 makes a component take up
// the entire size of its parent. justifyContent and alignItems center the
// contents vertically and horizontally.
var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});

// This line simply tells the ObjC engine that when you supply the entry point
// "SampleApp", render the component SampleApp (the component in this file)
AppRegistry.registerComponent('SampleApp', () => SampleApp);
```

After changing the entire contents of this file to the snippet above you should be able to simply cmd+R in the simulator to see the change. It should render “Loading movies..." until it gets the data back from Rotten Tomatoes at which point it should render “Movies loaded”. 

## ListView

Let’s now modify this application to render some of this data in a ListView.
