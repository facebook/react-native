---
title: Better List Views in React Native
author: Spencer Ahrens
authorTitle: Software Engineer at Facebook
authorURL: https://github.com/sahrens
authorImage: https://avatars1.githubusercontent.com/u/1509831
authorTwitter: sahrens2012
category: engineering
---

Many of you have started playing with some of our new List components already after our [teaser announcement in the community group](https://www.facebook.com/groups/react.native.community/permalink/921378591331053), but we are officially announcing them today! No more `ListView`s or `DataSource`s, stale rows, ignored bugs, or excessive memory consumption - with the latest React Native March 2017 release candidate (`0.43-rc.1`) you can pick from the new suite of components what best fits your use-case, with great perf and feature sets out of the box:

### [`<FlatList>`](https://facebook.github.io/react-native/releases/next/docs/flatlist.html) ###

This is the workhorse component for simple, performant lists. Provide an array of data and a `renderItem` function and you're good to go:

```
<FlatList
  data={[{title: 'Title Text', key: 'item1'}, ...]}
  renderItem={({item}) => <ListItem title={item.title} />}
/>
```

### [`<SectionList>`](https://facebook.github.io/react-native/releases/next/docs/sectionlist.html) ###

If you want to render a set of data broken into logical sections, maybe with section headers (e.g. in an alphabetical address book), and potentially with heterogeneous data and rendering (such as a profile view with some buttons followed by a composer, then a photo grid, then a friend grid, and finally a list of stories), this is the way to go.

```
<SectionList
  renderItem={({item}) => <ListItem title={item.title} />}
  renderSectionHeader={({section}) => <H1 title={section.key} />}
  sections={[ // homogenous rendering between sections
    {data: [...], key: ...},
    {data: [...], key: ...},
    {data: [...], key: ...},
  ]}
/>

<SectionList
  sections={[ // heterogeneous rendering between sections
    {data: [...], key: ..., renderItem: ...},
    {data: [...], key: ..., renderItem: ...},
    {data: [...], key: ..., renderItem: ...},
  ]}
/>
```

### [`<VirtualizedList>`](https://facebook.github.io/react-native/releases/next/docs/virtualizedlist.html) ##

The implementation behind the scenes with a more flexible API. Especially handy if your data is not in a plain array (e.g. an immutable list).

## Features ##

Lists are used in many contexts, so we packed the new components full of features to handle the majority of use cases out of the box:

* Scroll loading (`onEndReached`).
* Pull to refresh (`onRefresh` / `refreshing`).
* [Configurable](https://github.com/facebook/react-native/blob/master/Libraries/CustomComponents/Lists/ViewabilityHelper.js) viewability (VPV) callbacks (`onViewableItemsChanged` / `viewabilityConfig`).
* Horizontal mode (`horizontal`).
* Intelligent item and section separators.
* Multi-column support (`numColumns`)
* `scrollToEnd`, `scrollToIndex`, and `scrollToItem`
* Better Flow typing.

### Some Caveats ###

- The internal state of item subtrees is not preserved when content scrolls out of the render window. Make sure all your data is captured in the item data or external stores like Flux, Redux, or Relay.

- These components are based on `PureComponent` which means that they will not re-render if `props` remains shallow-equal. Make sure that everything your `renderItem` function depends on directly is passed as a prop that is not `===` after updates, otherwise your UI may not update on changes. This includes the `data` prop and parent component state. For example:

  ```javascript
  <FlatList
    data={this.state.data}
    renderItem={({item}) => <MyItem
      item={item}
      onPress={() => this.setState((oldState) => ({
        selected: { // New instance breaks `===`
          ...oldState.selected, // copy old data
          [item.key]: !oldState.selected[item.key], // toggle
        }}))
      }
      selected={
        !!this.state.selected[item.key] // renderItem depends on state
      }
    />}
    selected={ // Can be any prop that doesn't collide with existing props
      this.state.selected // A change to selected should re-render FlatList
    }
  />
  ```

- In order to constrain memory and enable smooth scrolling, content is rendered asynchronously offscreen. This means it's possible to scroll faster than the fill rate and momentarily see blank content. This is a tradeoff that can be adjusted to suit the needs of each application, and we are working on improving it behind the scenes.

- By default, these new lists look for a `key` prop on each item and use that for the React key. Alternatively, you can provide a custom `keyExtractor` prop.

## Performance ##

Besides simplifying the API, the new list components also have significant performance enhancements, the main one being nearly constant memory usage for any number of rows. This is done by 'virtualizing' elements that are outside of the render window by completely unmounting them from the component hierarchy and reclaiming the JS memory from the react components, along with the native memory from the shadow tree and the UI views. This has a catch which is that internal component state will not be preserved, so **make sure you track any important state outside of the components themselves, e.g. in Relay or Redux or Flux store.**

Limiting the render window also reduces the amount of work that needs to be done by React and the native platform, e.g from view traversals. Even if you are rendering the last of a million elements, with these new lists there is no need to iterate through all those elements in order to render. You can even jump to the middle with `scrollToIndex` without excessive rendering.

We've also made some improvements with scheduling which should help with application responsiveness. Items at the edge of the render window are rendered infrequently and at a lower priority after any active gestures or animations or other interactions have completed.

## Advanced Usage ##

Unlike `ListView`, all items in the render window are re-rendered any time any props change. Often this is fine because the windowing reduces the number of items to a constant number, but if your items are on the complex side, you should make sure to follow React best practices for performance and use `React.PureComponent` and/or `shouldComponentUpdate` as appropriate within your components to limit re-renders of the recursive subtree.

If you can calculate the height of your rows without rendering them, you can improve the user experience by providing the `getItemLayout` prop. This makes it much smoother to scroll to specific items with e.g. `scrollToIndex`, and will improve the scroll indicator UI because the height of the content can be determined without rendering it.

If you have an alternative data type, like an immutable list, `<VirtualizedList>` is the way to go. It takes a `getItem` prop that lets you return the item data for any given index and has looser flow typing.

There are also a bunch of parameters you can tweak if you have an unusual use case. For example, you can use `windowSize` to trade off memory usage vs. user experience, `maxToRenderPerBatch` to adjust fill rate vs. responsiveness, `onEndReachedThreshold` to control when scroll loading happens, and more.

## Future Work ##

* Migration of existing surfaces (ultimately deprecation of `ListView`).
* More features as we see/hear the need (let us know!).
* Sticky section header support.
* More performance optimizations.
* Support functional item components with state.
