---
id: maskedviewios
title: MaskedViewIOS
layout: docs
category: components
permalink: docs/maskedviewios.html
next: modal
previous: listview
---
Renders the child view with a mask specified in the `maskElement` prop.

```
import React from 'react';
import { MaskedViewIOS, Text, View } from 'react-native';

class MyMaskedView extends React.Component {
  render() {
    return (
      <MaskedViewIOS
        style={{ flex: 1 }}
        maskElement={
          <View style={styles.maskContainerStyle}>
            <Text style={styles.maskTextStyle}>
              Basic Mask
            </Text>
          </View>
        }
      >
        <View style={{ flex: 1, backgroundColor: 'blue' }} />
      </MaskedViewIOS>
    );
  }
}
```

The above example will render a view with a blue background that fills its
parent, and then mask that view with text that says "Basic Mask".

The alpha channel of the view rendered by the `maskElement` prop determines how
much of the view's content and background shows through. Fully or partially
opaque pixels allow the underlying content to show through but fully
transparent pixels block that content.

### Props

- [View props...](docs/view.html#props)
- [`maskElement`](docs/maskedviewios.html#maskelement)






---

# Reference

## Props

### `maskElement`

Should be a React element to be rendered and applied as the mask for the child element.

| Type | Required |
| - | - |
| element | Yes |






