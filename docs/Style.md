---
id: style
title: Style
layout: docs
category: Guides
permalink: docs/style.html
next: colors
---

React Native doesn't implement CSS but instead relies on JavaScript to let you style your application. This has been a controversial decision and you can read through those slides for the rationale behind it.

<script async class="speakerdeck-embed" data-id="2e15908049bb013230960224c1b4b8bd" data-ratio="2" src="//speakerdeck.com/assets/embed.js"></script>

## Declare Styles

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

All the attribute names and values are a subset of what works on the web. For layout, React Native implements [Flexbox](docs/flexbox.html).

## Using Styles

All the core components accept a style attribute.

```javascript
<Text style={styles.base} />
<View style={styles.background} />
```

They also accept an array of styles.

```javascript
<View style={[styles.base, styles.background]} />
```

The behavior is the same as `Object.assign`: in case of conflicting values, the one from the right-most element will have precedence and falsy values like `false`, `undefined` and `null` will be ignored. A common pattern is to conditionally add a style based on some condition.

```javascript
<View style={[styles.base, this.state.active && styles.active]} />
```

Finally, if you really have to, you can also create style objects in render, but they are highly discouraged. Put them last in the array definition.

```javascript
<View
  style={[styles.base, {
    width: this.state.width,
    height: this.state.width * this.state.aspectRatio
  }]}
/>
```

## Pass Styles Around

In order to let a call site customize the style of your component children, you can pass styles around. Use `View.propTypes.style` and `Text.propTypes.style` in order to make sure only styles are being passed.

```javascript
var List = React.createClass({
  propTypes: {
    style: View.propTypes.style,
    elementStyle: View.propTypes.style,
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
## Supported Properties

You can checkout latest support of CSS Properties in following Links.

- [View Properties](docs/view.html#style)
- [Image Properties](docs/image.html#style)
- [Text Properties](docs/text.html#style)
- [Flex Properties](docs/flexbox.html#content)
- [Transform Properties](docs/transforms.html#content)
