---
id: basics-component-listview
title: ListView
layout: docs
category: The Basics
permalink: docs/basics-component-listview.html
next: basics-dimensions
---

On mobile devices, lists are a core element in many applications. The [`ListView`](/react-native/docs/listview.html#content) component is a special type of [`View`](/react-native/docs/basics-component-view.html) that displays a *vertically* scrolling list of changing, but similarly structured, data.

`ListView` works best for possibly lengthy datasources (e.g., from an endpoint or database), where the number of items may not be known a priori.

> Unlike the more generic [`ScrollView`](/react-native/docs/basics-component-scrollview.html), the `ListView` only renders elements that are currently showing on the screen, not all the elements at once.

The `ListView` component requires two properties, `dataSource` and `renderRow`. `dataSource` is the source of information for the list. `renderRow` takes one item from the source and returns a formatted component to render.

This example creates a simple `ListView` of hardcoded data. It first initializes the `dataSource` that will be used to populate the `ListView`. Each item in the `dataSource` is then rendered as a `Text` component. Finally it renders the `ListView` and all `Text` components.

> A `rowHasChanged` function is required to use `ListView`. Here we just say a row has changed if the row we are on is not the same as the previous row.

```JavaScript
import React, { Component } from 'react';
import { AppRegistry, ListView, Text, View } from 'react-native';

class ListViewBasics extends Component {
  // Initialize the hardcoded data
  constructor(props) {
    super(props);
    const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
    this.state = {
      dataSource: ds.cloneWithRows([
        'John', 'Joel', 'James', 'Jimmy', 'Jackson', 'Jillian', 'Julie', 'Devin'
      ])
    };
  }
  render() {
    return (
      <View style={{paddingTop: 22}}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) => <Text>{rowData}</Text>}
        />
      </View>
    );
  }
}

// App registration and rendering
AppRegistry.registerComponent('AwesomeProject', () => ListViewBasics);
```
