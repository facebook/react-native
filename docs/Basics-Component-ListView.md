---
id: basics-component-listview
title: ListView
layout: docs
category: Basics
permalink: docs/basics-component-listview.html
next: basics-integration-with-existing-apps
---

On mobile devices, lists are a core element in many applications. The [`ListView`](/react-native/docs/listview.html#content) component is a special type of [`View`](/react-native/docs/basics-component-view.html) that displays a *vertically* scrolling list of changing, but similarly structured, data.

`ListView` works best for possibly lengthy datasources (e.g., from an endpoint or database), where the number of items may not be known a priori.

> Unlike the more generic [`ScrollView`](/react-native/docs/basics-component-scrollview.html), the `ListView` only renders elements that are currently showing on the screen, not all the elements at once.

The `ListView` component requires two properties, `dataSource` and `renderRow`. `dataSource` is the actual source of information that will be part of the list. `renderRow` takes the data and returns a renderable component to display.

This example creates a simple `ListView` of hardcoded data. It first initializes the `datasource` that will be used to populate the `ListView`. Then it renders that `ListView` with that data.

> A `rowHasChanged` function is required to use `ListView`. Here we just say a row has changed if the row we are on is not the same as the previous row.

```JavaScript
import React from 'react';
import { AppRegistry, Text, View, ListView} from 'react-native';

var SimpleList = React.createClass({
  // Initialize the hardcoded data
  getInitialState: function() {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    return {
      dataSource: ds.cloneWithRows(['John', 'Joel', 'James', 'Jimmy', 'Jackson', 'Jillian', 'Julie'])
    };
  },
  render: function() {
    return (
      <View>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) => <Text>{rowData}</Text>}
        />
      </View>
    );
  }
});

// App registration and rendering
AppRegistry.registerComponent('MyApp', () => SimpleList);
```
