---
id: style
title: Style
layout: docs
category: Guides
permalink: docs/style.html
next: timers
---

## Declaring Styles

The way to declare styles in React Native is the following:

```javascript
var styles = StyleSheet.create({
  base: {
    width: 38,
    height: 38,
  },
  background: {
    backgroundColor: '#222222',
  },
  active: {
    borderWidth: 2,
    borderColor: '#00ff00',
  },
});
```

`StyleSheet.create` construct is optional but provides some key advantages. It ensures that the values are **immutable** and **opaque** by transforming them into plain numbers that reference an internal table. By putting it at the end of the file, you also ensure that they are only created once for the application and not on every render.

## Using Styles

All the core components accept a style attribute

```javascript
<Text style={styles.base} />
<View style={styles.background} />
```

and also accepts an array of styles

```javascript
<View style={[style.base, style.background]} />
```

The behavior is the same as `Object.assign`: in case of conflicting values, the one from the right-most element will have precedence and falsy values like `false`, `undefined` and `null` will be ignored. A common pattern is to conditionally add a style based on some condition.

```javascript
<View style={[style.base, this.state.active && style.active]} />
```

Finally, if you really have to, you can also create style objects in render, but they are highly discouraged. Put them last in the array definition.

```javascript
<View
  style={[style.base, {
    width: this.state.width,
    height: this.state.width * this.state.aspectRatio
  }]}
/>
```

## Pass Styles Around

In order to let a call site customize the style of your component children, you can pass styles around. Use `View.stylePropType` and `Text.stylePropType` in order to make sure only styles are being passed.

```javascript
var List = React.createClass({
  propTypes: {
    style: View.stylePropType,
    elementStyle: View.stylePropType,
  },
  render: function() {
    return (
      <View style={this.props.style}>
        {elements.map((element) =>
          <View style={[styles.element, this.props.elementStyle]} />
        )}
      </View>
    );
  }
});

// ... in another file ...
<List style={styles.list} elementStyle={styles.listElement} />
```
