---
id: basics-component-scrollview
title: ScrollView
layout: docs
category: Basics
permalink: docs/basics-component-scrollview.html
next: basics-component-listview
---

Given the screen sizes of mobile devices, the ability to scroll through data is generally paramount for a proper usability experience.

The [`ScrollView`](/react-native/docs/scrollview.html) is a generic scrolling container that can host multiple components and views. The scrollable items need not be homogenous, and you can scroll both vertically and horizontally (by setting the `horizontal` property).

`ScrollView` works best to present a list of short, static items of a known quantity. All the elements and views of a `ScrollView` are rendered a priori, even if they are not currently shown on the screen. Contrast this with a `ListView`, which render only those views that are on the screen and remove views that go off-screen.

> [`TextView`](/react-native/docs/basics-component-textview.html) and [`ListView`](/react-native/docs/basics-component-listview.html) are specialized scrollable containers.

This contrived example creates a horizontal `ScrollView` with a static amount of heterogenous elements (images and text).

```JavaScript
import React, { AppRegistry, ScrollView, Image, Text, View } from 'react-native'

var SimpleScrollView = React.createClass({
  render(){
      return(
        <ScrollView horizontal={true}>
          <View>
            <Image source={require('./img/check.png')} />
          </View>
          <View>
            <Image source={require('./img/check.png')} />
          </View>
          <View>
            <Image source={require('./img/check.png')} />
          </View>
          <View>
            <Text style={{fontSize:96}}>Text1</Text>
          </View>
          <View>
            <Text style={{fontSize:96}}>Text2</Text>
          </View>
          <View>
            <Text style={{fontSize:96}}>Text3</Text>
          </View>
          <View>
            <Text style={{fontSize:96}}>Text4</Text>
          </View>
          <View>
            <Image source={require('./img/check.png')} />
          </View>
          <View>
            <Image source={require('./img/check.png')} />
          </View>
          <View>
            <Image source={require('./img/check.png')} />
          </View>
          <View>
            <Text style={{fontSize:96}}>Text5</Text>
          </View>
          <View>
            <Text style={{fontSize:96}}>Text6</Text>
          </View>
        </ScrollView>
    );
  }
});


AppRegistry.registerComponent('MyApp', () => SimpleScrollView);
```
