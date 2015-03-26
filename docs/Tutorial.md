---
id: tutorial
title: Tutorial
layout: docs
category: Quick Start
permalink: docs/tutorial.html
next: videos
---

## Preface

This tutorial aims to get you up to speed with writing iOS apps using React Native.

We assume you have experience writing websites with React. If not, you can learn about it on the [React website](http://facebook.github.io/react/).


## Setup

React Native has a few requirements which you can find on the [github page](https://github.com/facebook/react-native#requirements) (specifically OSX, Xcode, Homebrew, node, npm, watchman, and (optionally) flow)

After installing these dependencies there are two simple commands to get a React Native project all set up for development.

1. `npm install -g react-native-cli`

    `react-native-cli` is a command line interface that does the rest of the set up. It’s also an npm module so you can get it very easily. This will install `react-native-cli` so you can run it as a command in your terminal. You only need to do this once ever.

2. `react-native init AwesomeProject`

    This command fetches the React Native source code, installs all of the other npm modules that it depends on, and creates a new Xcode project in `AwesomeProject/AwesomeProject.xcodeproj`.


## Development

You can now open this new project (`AwesomeProject/AwesomeProject.xcodeproj`) in Xcode and simply build and run it with cmd+R. Doing so will start a node server which enables live code reloading by packaging and serving the latest JS bundle to the simulator at runtime. From here out you can see your changes by pressing cmd+R in the simulator rather than recompiling in Xcode.

For this tutorial let’s build a simple version of the Movies app that fetches 25 movies that are in theaters and displays them in a ListView.


### Hello World

`react-native init` will copy `Examples/SampleProject` to whatever you named your project, in this case AwesomeProject. This is a simple hello world app. You can edit `index.ios.js` to make changes to the app and then press cmd+R in the simulator to see your changes.


### Mocking data

Before we write the code to fetch actual Rotten Tomatoes data, let's mock some data so we can get started with rendering some views right away. At Facebook we typically declare constants at the top of JS files just below the requires but feel free to add the following constant wherever you like:

```javascript
var MOCKED_MOVIES_DATA = [
  {title: 'Title', year: '2015', posters: {thumbnail: 'http://i.imgur.com/UePbdph.jpg'}},
];
```


### Render a movie

We're going to render the title, year, and thumbnail for the movie. Since we want to render an image, which is an Image component in React Native, add Image to the list of React requires above.

```javascript
var {
  AppRegistry,
  Image,
  StyleSheet,
  Text,
  View,
} = React;
```

Now change the render function so that we're rendering the stuff mentioned above rather than hello world.

```javascript
  render: function() {
    var movie = MOCKED_MOVIES_DATA[0];
    return (
      <View style={styles.container}>
        <Text>{movie.title}</Text>
        <Text>{movie.year}</Text>
        <Image source={{uri: movie.posters.thumbnail}} />
      </View>
    );
  }
```

Press cmd+R and you should see "Title" sitting above "2015". Notice that the Image doesn't render anything. This is because we haven't specified the width and height of the image we want to render. You do that via styles. While we're changing the styles let's also clean up the styles we're no longer using.

```javascript
var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  thumbnail: {
    width: 53,
    height: 81,
  },
});
```

And lastly we need to apply this still to the Image component:

```javascript
        <Image
          source={{uri: movie.posters.thumbnail}}
          style={styles.thumbnail}
        />
```

Press cmd+R and the image should now render.

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialMock.png" />
</div>


### Add some styling

Great, we've rendered our data, now let's make it look better. I'd like to put the text to the right of the image and make the title larger and centered within that area:

```
+---------------------------------+
|+-------++----------------------+|
||       ||        Title         ||
|| Image ||                      ||
||       ||        Year          ||
|+-------++----------------------+|
+---------------------------------+
```

Since we've got some components layed out horizontally and some components layed out vertically, we'll need to add another container around the Texts.

```javascript
      return (
        <View style={styles.container}>
          <Image
            source={{uri: movie.posters.thumbnail}}
            style={styles.thumbnail}
          />
          <View style={styles.rightContainer}>
            <Text style={styles.title}>{movie.title}</Text>
            <Text style={styles.year}>{movie.year}</Text>
          </View>
        </View>
      );
```

Not too much has changed, we added a container around the Texts and then moved them after the Image (because they're to the right of the Image). Let's see what the style changes look like:

```javascript
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
```

We simply added `flexDirection: 'row'` which means that children are layed out horizontally instead of vertically.

```javascript
  rightContainer: {
    flex: 1,
  },
```

This means that the rightContainer takes up the remaining space in the parent container that isn't taken up by the Image. If this doesn't make sense, add a backgroundColor to rightContainer and then try removing the `flex: 1`. You'll see how the container is only the size of its children instead of taking up the remaining space of its parent.

```javascript
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  year: {
    textAlign: 'center',
  },
```

This is pretty straightforward if you've ever seen CSS before. Make the title larger, add some space below it, and center all of the text within their parent container (rightContainer).

Go ahead and press cmd+R and you'll see the updated view.

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialStyledMock.png" />
</div>

### Fetching real data

Fetching data from Rotten Tomatoes's API isn't really relevant to learning React Native so feel free to breeze through this section.

Add the following constants to the top of the file (typically below the requires) to create the REQUEST_URL used to request data with.

```javascript
var API_KEY = '7waqfqbprs7pajbz28mqf6vz';
var API_URL = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
var PAGE_SIZE = 25;
var PARAMS = '?apikey=' + API_KEY + '&page_limit=' + PAGE_SIZE;
var REQUEST_URL = API_URL + PARAMS;
```

Add some initial state to our application so that we can check this.state.movies === null to determine whether the movies data has been loaded or not. We can set this data when the response comes back with this.setState({movies: moviesData}). Add this code just above the render function inside our React class.

```javascript
  getInitialState: function() {
    return {
      movies: null,
    };
  },
```

We want to send off the request after the component has finished loading. componentDidMount is a function on React components that React will call exactly once just after the component has been loaded.

```javascript
  componentDidMount: function() {
    this.fetchData();
  },
```

Implement our fetchData function to actually make the request and handle the response. All you need to do is call this.setState({movies: data}) because the way React works is that setState actually triggers a re-render and then the render function will notice that
this.state.movies is no longer null.

```javascript
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
```

Now modify the render function to render a loading view if we don't have any movies data, and to render the first movie otherwise.

```javascript
  render: function() {
    if (!this.state.movies) {
      return this.renderLoadingView();
    }

    var movie = this.state.movies[0];
    return this.renderMovie(movie);
  },

  renderLoadingView: function() {
    return (
      <View style={styles.container}>
        <Text>
          Loading movies...
        </Text>
      </View>
    );
  },

  renderMovie: function(movie) {
    return (
      <View style={styles.container}>
        <Image
          source={{uri: movie.posters.thumbnail}}
          style={styles.thumbnail}
        />
        <View style={styles.rightContainer}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.year}>{movie.year}</Text>
        </View>
      </View>
    );
  },
```

Now press cmd+R and you should see "Loading movies..." until the response comes back, then it will render the first movie it fetched from Rotten Tomatoes.

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialSingleFetched.png" />
</div>

## ListView

Let’s now modify this application to render all of this data in a ListView, rather than just the first movie.

Why is a ListView better than just rendering all of these elements or putting them in a ScrollView? Despite React being fast, rendering a possibly infinite list of elements could be slow. ListView schedules rendering of views so that you only display the ones on screen and those already rendered but off screen are removed from the hierarchy.

First thing's first, add the ListView require to the top of the file.

```javascript
var {
  AppRegistry,
  Image,
  ListView,
  StyleSheet,
  Text,
  View,
} = React;
```

Now modify the render funtion so that once we have our data it renders a ListView of movies instead of a single movie.

```javascript
  render: function() {
    if (!this.state.loaded) {
      return this.renderLoadingView();
    }

    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderMovie}
      />
    );
  },
```

What is this dataSource thing and why do we use it? This way we can very cheaply know which rows have changed between updates.

You'll notice we added dataSource from this.state. The next step is to add an empty dataSource to getInitialState. Also, now that we're storing the data in dataSource, we should change this.state.movies to be this.state.loaded (boolean) so we aren't storing the data twice.

```javascript
  getInitialState: function() {
    return {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      loaded: false,
    };
  },
```

And here's the modified this.setState in the response handler in fetchData:

```javascript
  fetchData: function() {
    fetch(REQUEST_URL)
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(responseData.movies),
          loaded: true,
        });
      })
      .done();
  },
```

And here's the final result:

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialFinal.png" />
</div>

There's still some work to be done to make it a fully functional app such as adding navigation, search, infinite scroll loading, etc. Check the [Movies Example](https://github.com/facebook/react-native/tree/master/Examples/Movies) to see it all working.


### Final source code

```javascript
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */
'use strict';

var React = require('react-native');
var {
  AppRegistry,
  Image,
  ListView,
  StyleSheet,
  Text,
  View,
} = React;

var API_KEY = '7waqfqbprs7pajbz28mqf6vz';
var API_URL = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
var PAGE_SIZE = 25;
var PARAMS = '?apikey=' + API_KEY + '&page_limit=' + PAGE_SIZE;
var REQUEST_URL = API_URL + PARAMS;

var SampleApp = React.createClass({
  getInitialState: function() {
    return {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      loaded: false,
    };
  },

  componentDidMount: function() {
    this.fetchData();
  },

  fetchData: function() {
    fetch(REQUEST_URL)
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(responseData.movies),
          loaded: true,
        });
      })
      .done();
  },

  render: function() {
    if (!this.state.loaded) {
      return this.renderLoadingView();
    }

    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderMovie}
      />
    );
  },

  renderLoadingView: function() {
    return (
      <View style={styles.container}>
        <Text>
          Loading movies...
        </Text>
      </View>
    );
  },

  renderMovie: function(movie) {
    return (
      <View style={styles.container}>
        <Image
          source={{uri: movie.posters.thumbnail}}
          style={styles.thumbnail}
        />
        <View style={styles.rightContainer}>
          <Text style={styles.title}>{movie.title}</Text>
          <Text style={styles.year}>{movie.year}</Text>
        </View>
      </View>
    );
  },
});

var styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  rightContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  year: {
    textAlign: 'center',
  },
  thumbnail: {
    width: 53,
    height: 81,
  },
});

AppRegistry.registerComponent('SampleApp', () => SampleApp);
```

