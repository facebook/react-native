

## Nested Text

In iOS, the way to display formatted text is by using `NSAttributedString`: you give the text that you want to display and annotate ranges with some specific formatting. In practice, this is very tedious. For React Native, we decided to use web paradigm for this where you can nest text to achieve the same effect.

```javascript
<Text style={{fontWeight: 'bold'}}>
  I am bold
  <Text style={{color: 'red'}}>
    and red
  </Text>
</Text>
```

Behind the scenes, this is going to be converted to a flat `NSAttributedString` that contains the following information

```javascript
"I am bold and red"
0-9: bold
9-17: bold, red
```

## Containers

The `<Text>` element is special relative to layout: everything inside is no longer using the flexbox layout but using text layout. This means that elements inside of a `<Text>` are no longer rectangles, but wrap when they see the end of the line.

```javascript
<Text>
  <Text>First part and </Text>
  <Text>second part</Text>
</Text>
// Text container: all the text flows as if it was one
// |First part |
// |and second |
// |part       |

<View>
  <Text>First part and </Text>
  <Text>second part</Text>
</View>
// View container: each text is its own block
// |First part |
// |and        |
// |second part|
```

## Limited Style Inheritance

On the web, the usual way to set a font family and size for the entire document is to write:

```css
/* CSS, *not* React Native */
html {
  font-family: 'lucida grande', tahoma, verdana, arial, sans-serif;
  font-size: 11px;
  color: #141823;
}
```

When the browser is trying to render a text node, it's going to go all the way up to the root element of the tree and find an element with a `font-size` attribute. An unexpected property of this system is that **any** node can have `font-size` attribute, including a `<div>`. This was designed for convenience, even though not really semantically correct.

In React Native, we are more strict about it: **you must wrap all the text nodes inside of a `<Text>` component**; you cannot have a text node directly under a `<View>`.

```javascript
// BAD: will raise exception, can't have a text node as child of a <View>
<View>
  Some text
</View>

// GOOD
<View>
  <Text>
    Some text
  </Text>
</View>
```

You also lose the ability to set up a default font for an entire subtree. The recommended way to use consistent fonts and sizes across your application is to create a component `MyAppText` that includes them and use this component across your app. You can also use this component to make more specific components like `MyAppHeaderText` for other kinds of text.

```javascript
<View>
  <MyAppText>Text styled with the default font for the entire application</MyAppText>
  <MyAppHeaderText>Text styled as a header</MyAppHeaderText>
</View>
```

React Native still has the concept of style inheritance, but limited to text subtrees. In this case, the second part will be both bold and red.

```javascript
<Text style={{fontWeight: 'bold'}}>
  I am bold
  <Text style={{color: 'red'}}>
    and red
  </Text>
</Text>
```

We believe that this more constrained way to style text will yield better apps:

- (Developer) React components are designed with strong isolation in mind: You should be able to drop a component anywhere in your application, trusting that as long as the props are the same, it will look and behave the same way. Text properties that could inherit from outside of the props would break this isolation.

- (Implementor) The implementation of React Native is also simplified. We do not need to have a `fontFamily` field on every single element, and we do not need to potentially traverse the tree up to the root every time we display a text node. The style inheritance is only encoded inside of the native Text component and doesn't leak to other components or the system itself.
