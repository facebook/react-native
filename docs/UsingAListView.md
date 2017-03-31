---
id: using-a-listview
title: Using a ListView
layout: docs
category: The Basics
permalink: docs/using-a-listview.html
next: network
previous: using-a-scrollview
---

The `ListView` component displays a scrolling list of changing, but similarly structured, data.

`ListView` works well for long lists of data, where the number of items might change over time. Unlike the more generic [`ScrollView`](docs/using-a-scrollview.html), the `ListView` only renders elements that are currently showing on the screen, not all the elements at once.

The `ListView` component requires two props: `dataSource` and `renderRow`. `dataSource` is the source of information for the list. `renderRow` takes one item from the source and returns a formatted component to render.

This example creates a simple `ListView` of hardcoded data. It first initializes the `dataSource` that will be used to populate the `ListView`. Each item in the `dataSource` is then rendered as a `Text` component. Finally it renders the `ListView` and all `Text` components.

> A `rowHasChanged` function is required to use `ListView`. Here we just say a row has changed if the row we are on is not the same as the previous row.

```ReactNativeWebPlayer
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
      <View style={{flex: 1, paddingTop: 22}}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={(rowData) => <Text>{rowData}</Text>}
        />
      </View>
    );
  }
}

// App registration and rendering
AppRegistry.registerComponent('ListViewBasics', () => ListViewBasics);
```

One of the most common uses for a `ListView` is displaying data that you fetch from a server. To do that, you will need to [learn about networking in React Native](docs/network.html).
