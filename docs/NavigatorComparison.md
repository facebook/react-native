---
id: navigator-comparison
title: Navigation
layout: docs
category: Guides
permalink: docs/navigator-comparison.html
next: performance
---

Mobile apps rarely consist of just one screen or scene. As soon as you add a second scene to your app, you will have to take into consideration how the user will navigate from one scene to the other.

Navigators in React Native allow you to push and pop scenes in a master/detail stack, or to pop up modal scenes. Navigators handle the transitions between scenes, and also maintain the navigational state of your application.

If you are just getting started with React Native, you will probably want to start with the `Navigator` component.

## Navigator

`Navigator` is a cross-platform implementation of a navigation stack, so it works on both iOS and Android. It is easy to customize and includes simple navigation bars.

```js
<Navigator
  initialRoute={{ title: 'My Initial Scene', index: 0}}
  renderScene={(route, navigator) => {
      // We'll get to this function soon.
  }}
/>
```

Something you will encounter a lot when dealing with navigation is the concept of routes. A route is an object that contains information about a scene. It is used to provide all the context the `renderScene` function needs to render a scene.

The `push` and `pop` functions provided by Navigator can be used to push and pop routes into the navigation stack. A more complete example that demonstrates the pushing and popping of routes could therefore look something like this:

```js
class MyScene extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    onForward: PropTypes.func.isRequired,
    onBack: PropTypes.func.isRequired,
  }
  render() {
    return (
      <View>
        <Text>Current Scene: { this.props.title }</Text>
        <TouchableHighlight onPress={this.props.onForward}>
          <Text>Tap me to load the next scene</Text>
        </TouchableHighlight>
        <TouchableHighlight onPress={this.props.onBack}>
          <Text>Tap me to go back</Text>
        </TouchableHighlight>
      </View>
    )
  }
}

class SimpleNavigationApp extends Component {
  render() {
    return (
      <Navigator
        initialRoute={{ title: 'My Initial Scene', index: 0 }}
        renderScene={(route, navigator) =>
          <MyScene
            title={route.title}
            onForward={ () => {
              const nextIndex = route.index + 1;
              navigator.push({
                title: 'Scene ' + nextIndex,
                index: nextIndex,
              });
            }}
            onBack={() => {
              if (route.index > 0) {
                navigator.pop();
              }
            }}
          />
        }
      />
    )
  }
}
```

In this example, the `MyScene` component is passed the title of the current route via the `title` prop. It displays two tappable components that call the `onForward` and `onBack` functions passed through its props, which in turn will call `navigator.push()` and `navigator.pop()` as needed.

While this is a very basic example, it can easily be adapted to render an entirely different component based on the route that is passed to the `renderScene` function. Navigator will push new scenes from the right by default, and you can control this behavior by using the `configureScene` function. Check out the [Navigator API reference](docs/navigator.html) to learn more.

## NavigatorIOS

If you are targeting iOS only, you may also want to consider using `NavigatorIOS`. It looks and feels just like `UINavigationController`, because it is actually built on top of it.

```js
<NavigatorIOS
  initialRoute={{
    component: MyScene,
    title: 'My Initial Scene',
    passProps: { myProp: 'foo' },
  }}
/>
```

Just like Navigator, it it uses routes to represent scenes, with some important differences. The actual component that will be rendered can be specified using the `component` key in the route, and any props that should be passed to this component can be specified in `passProps`. A navigator object is automatically passed as a prop to the component, allowing you to call `push` and `pop` as needed.

Check out the [NavigatorIOS reference docs](docs/navigatorios.html) to learn more about this component.

```js
class MyScene extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired,
    navigator: PropTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this._onForward = this._onForward.bind(this);
    this._onBack = this._onBack.bind(this);
  }

  _onForward() {
    this.props.navigator.push({
      title: 'Scene ' + nextIndex,
    });
  }

  _onBack() {
    this.props.navigator.pop();
  }

  render() {
    return (
      <View>
        <Text>Current Scene: { this.props.title }</Text>
        <TouchableHighlight onPress={this._onForward}>
          <Text>Tap me to load the next scene</Text>
        </TouchableHighlight>
        <TouchableHighlight onPress={this._onBack}>
          <Text>Tap me to go back</Text>
        </TouchableHighlight>
      </View>
    )
  }
}

class NavigatorIOSApp extends Component {
  render() {
    return (
      <NavigatorIOS
        initialRoute={{
          component: MyScene,
          title: 'My Initial Scene',
          index: 0
        }}
        renderScene={ (route, navigator) =>
          <MyScene title={route.title} />
        }
      />
    )
  }
}
```

> You may also want to check out [react-native-navigation](https://github.com/wix/react-native-navigation), a component that aims to provide native navigation on both iOS and Android.

## Navigation (Experimental)

If you are looking for a more powerful navigation API, check out [NavigationExperimental](https://github.com/facebook/react-native/tree/master/Examples/UIExplorer/NavigationExperimental). It provides greater customization over your transitions, uses single-directional data flow using reducers to manipulate state at a top-level object, and offloads transition animations to the GPU.
