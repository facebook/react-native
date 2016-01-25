---
id: tutorial
title: Tutorial
layout: docs
category: Quick Start
permalink: docs/tutorial.html
next: videos
---

## Preface

This tutorial aims to get you up to speed with writing iOS and Android apps using React Native. If you're wondering what React Native is and why Facebook built it, this [blog post](https://code.facebook.com/posts/1014532261909640/react-native-bringing-modern-web-techniques-to-mobile/) explains that.

We assume you have experience writing applications with React. If not, you can learn about it on the [React website](http://facebook.github.io/react/).


## Setup

React Native requires the basic setup explained at [React Native Getting Started](https://facebook.github.io/react-native/docs/getting-started.html#content).

After installing these dependencies there are two simple commands to get a React Native project all set up for development.

1. `npm install -g react-native-cli`

    react-native-cli is a command line interface that does the rest of the set up. It’s installable via npm. This will install `react-native` as a command in your terminal. You only ever need to do this once.

2. `react-native init AwesomeProject`

    This command fetches the React Native source code and dependencies and then creates a new Xcode project in `AwesomeProject/iOS/AwesomeProject.xcodeproj` and a gradle project in `AwesomeProject/android/app`.


## Development

For iOS, you can now open this new project (`AwesomeProject/ios/AwesomeProject.xcodeproj`) in Xcode and simply build and run it with `⌘+R`. Doing so will also start a Node server which enables live code reloading. With this you can see your changes by pressing `⌘+R` in the simulator rather than recompiling in Xcode.

For Android, run `react-native run-android` from `AwesomeProject` to install the generated app on your emulator or device, and start the Node server which enables live code reloading. To see your changes you have to open the rage-shake-menu (either shake the device or press the menu button on devices, press F2 or Page Up for emulator, ⌘+M for Genymotion), and then press `Reload JS`.

For this tutorial we'll be building a simple version of the Movies app that fetches 25 movies that are in theaters and displays them in a ListView.

### Hello World

`react-native init` will generate an app with the name of your project, in this case AwesomeProject. This is a simple hello world app. For iOS, you can edit `index.ios.js` to make changes to the app and then press ⌘+R in the simulator to see the changes. For Android, you can edit `index.android.js` to make changes to the app and press `Reload JS` from the rage shake menu to see the changes.

### Mocking data

Before we write the code to fetch actual Rotten Tomatoes data let's mock some data so we can get our hands dirty with React Native. At Facebook we typically declare constants at the top of JS files, just below the imports, but feel free to add the following constant wherever you like. In `index.ios.js` or `index.android.js` :

```javascript
var MOCKED_MOVIES_DATA = [
  {title: 'Title', year: '2015', posters: {thumbnail: 'http://i.imgur.com/UePbdph.jpg'}},
];
```


### Render a movie

We're going to render the title, year, and thumbnail for the movie. Since thumbnail is an Image component in React Native, add Image to the list of React imports below.

```javascript
import React, {
  AppRegistry,
  Component,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
```

Now change the render function so that we're rendering the data mentioned above rather than hello world.

```javascript
  render() {
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

Press `⌘+R` / `Reload JS` and you should see "Title" above "2015". Notice that the Image doesn't render anything. This is because we haven't specified the width and height of the image we want to render. This is done via styles. While we're changing the styles let's also clean up the styles we're no longer using.

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

And lastly we need to apply this style to the Image component:

```javascript
        <Image
          source={{uri: movie.posters.thumbnail}}
          style={styles.thumbnail}
        />
```

Press `⌘+R` / `Reload JS` and the image should now render.

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialMock.png" />
  <img src="/react-native/img/TutorialMock2.png" />
</div>


### Add some styling

Great, we've rendered our data. Now let's make it look better. I'd like to put the text to the right of the image and make the title larger and centered within that area:

```
+---------------------------------+
|+-------++----------------------+|
||       ||        Title         ||
|| Image ||                      ||
||       ||        Year          ||
|+-------++----------------------+|
+---------------------------------+
```

We'll need to add another container in order to vertically lay out components within horizontally laid out components.

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

We use FlexBox for layout - see [this great guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) to learn more about it.

In the above code snippet, we simply added `flexDirection: 'row'` that will make children of our main container to be layed out horizontally instead of vertically.

Now add another style to the JS `style` object:

```javascript
  rightContainer: {
    flex: 1,
  },
```

This means that the `rightContainer` takes up the remaining space in the parent container that isn't taken up by the Image. If this doesn't make sense, add a `backgroundColor` to `rightContainer` and then try removing the `flex: 1`. You'll see that this causes the container's size to be the minimum size that fits its children.

Styling the text is pretty straightforward:

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

Go ahead and press `⌘+R` / `Reload JS` and you'll see the updated view.

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialStyledMock.png" />
  <img src="/react-native/img/TutorialStyledMock2.png" />
</div>

### Fetching real data

Fetching data from Rotten Tomatoes's API isn't really relevant to learning React Native so feel free to breeze through this section.

Add the following constants to the top of the file (typically below the imports) to create the REQUEST_URL used to request data with.

```javascript
/**
 * For quota reasons we replaced the Rotten Tomatoes' API with a sample data of
 * their very own API that lives in React Native's Github repo.
 */
var REQUEST_URL = 'https://raw.githubusercontent.com/facebook/react-native/master/docs/MoviesExample.json';
```

Add some initial state to our application so that we can check `this.state.movies === null` to determine whether the movies data has been loaded or not. We can set this data when the response comes back with `this.setState({movies: moviesData})`. Add this code just above the render function inside our React class.

```javascript
  constructor(props) {
    super(props); 
    this.state = {
      movies: null,
    };
  }
```

We want to send off the request after the component has finished loading. `componentDidMount` is a function of React components that React will call exactly once, just after the component has been loaded.

```javascript
  componentDidMount() {
    this.fetchData();
  }
```

Now add `fetchData` function used above to our main component. This method will be responsible for handling data fetching. All you need to do is call `this.setState({movies: data})` after resolving the promise chain because the way React works is that `setState` actually triggers a re-render and then the render function will notice that `this.state.movies` is no longer `null`.  Note that we call `done()` at the end of the promise chain - always make sure to call `done()` or any errors thrown will get swallowed.

```javascript
  fetchData() {
    fetch(REQUEST_URL)
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          movies: responseData.movies,
        });
      })
      .done();
  }
```

Now modify the render function to render a loading view if we don't have any movies data, and to render the first movie otherwise.

```javascript
  render() {
    if (!this.state.movies) {
      return this.renderLoadingView();
    }

    var movie = this.state.movies[0];
    return this.renderMovie(movie);
  }

  renderLoadingView() {
    return (
      <View style={styles.container}>
        <Text>
          Loading movies...
        </Text>
      </View>
    );
  }

  renderMovie(movie) {
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
  }
```

Now press `⌘+R` / `Reload JS` and you should see "Loading movies..." until the response comes back, then it will render the first movie it fetched from Rotten Tomatoes.

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialSingleFetched.png" />
  <img src="/react-native/img/TutorialSingleFetched2.png" />
</div>

## ListView

Let's now modify this application to render all of this data in a `ListView` component, rather than just rendering the first movie.

Why is a `ListView` better than just rendering all of these elements or putting them in a `ScrollView`? Despite React being fast, rendering a possibly infinite list of elements could be slow. `ListView` schedules rendering of views so that you only display the ones on screen and those already rendered but off screen are removed from the native view hierarchy.

First things first: add the `ListView` import to the top of the file.

```javascript
import React, {
  AppRegistry,
  Component,
  Image,
  ListView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
```

Now modify the render function so that once we have our data it renders a ListView of movies instead of a single movie.

```javascript
  render() {
    if (!this.state.loaded) {
      return this.renderLoadingView();
    }

    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderMovie}
        style={styles.listView}
      />
    );
  }
```

The `dataSource` is an interface that `ListView` is using to determine which rows have changed over the course of updates.

You'll notice we used `dataSource` from `this.state`. The next step is to add an empty `dataSource` to the object returned by `constructor`. Also, now that we're storing the data in `dataSource`, we should no longer use `this.state.movies` to avoid storing data twice. We can use boolean property of the state (`this.state.loaded`) to tell whether data fetching has finished.

```javascript
  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      loaded: false,
    };
  }
```

And here is the modified `fetchData` method that updates the state accordingly:

```javascript
  fetchData() {
    fetch(REQUEST_URL)
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(responseData.movies),
          loaded: true,
        });
      })
      .done();
  }
```

Finally, we add styles for the `ListView` component to the `styles` JS object:
```javascript
  listView: {
    paddingTop: 20,
    backgroundColor: '#F5FCFF',
  },
```

And here's the final result:

<div class="tutorial-mock">
  <img src="/react-native/img/TutorialFinal.png" />
  <img src="/react-native/img/TutorialFinal2.png" />
</div>

There's still some work to be done to make it a fully functional app such as: adding navigation, search, infinite scroll loading, etc. Check the [Movies Example](https://github.com/facebook/react-native/tree/master/Examples/Movies) to see it all working.


### Final source code

```javascript
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {
  AppRegistry,
  Component,
  Image,
  ListView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

var API_KEY = '7waqfqbprs7pajbz28mqf6vz';
var API_URL = 'http://api.rottentomatoes.com/api/public/v1.0/lists/movies/in_theaters.json';
var PAGE_SIZE = 25;
var PARAMS = '?apikey=' + API_KEY + '&page_limit=' + PAGE_SIZE;
var REQUEST_URL = API_URL + PARAMS;

class AwesomeProject extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2,
      }),
      loaded: false,
    };
  }

  componentDidMount() {
    this.fetchData();
  }

  fetchData() {
    fetch(REQUEST_URL)
      .then((response) => response.json())
      .then((responseData) => {
        this.setState({
          dataSource: this.state.dataSource.cloneWithRows(responseData.movies),
          loaded: true,
        });
      })
      .done();
  }

  render() {
    if (!this.state.loaded) {
      return this.renderLoadingView();
    }

    return (
      <ListView
        dataSource={this.state.dataSource}
        renderRow={this.renderMovie}
        style={styles.listView}
      />
    );
  }

  renderLoadingView() {
    return (
      <View style={styles.container}>
        <Text>
          Loading movies...
        </Text>
      </View>
    );
  }

  renderMovie(movie) {
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
  }
}

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
  listView: {
    paddingTop: 20,
    backgroundColor: '#F5FCFF',
  },
});

AppRegistry.registerComponent('AwesomeProject', () => AwesomeProject);
```
