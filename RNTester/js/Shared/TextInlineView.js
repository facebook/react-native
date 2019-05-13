/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const React = require('react');
const {Image, Text, TouchableHighlight, View} = require('react-native');

function Basic() {
  return (
    <Text>
      This text contains an inline blue view{' '}
      <View style={{width: 25, height: 25, backgroundColor: 'steelblue'}} /> and
      an inline image <Image source={require('../flux.png')} />. Neat, huh?
    </Text>
  );
}

function ClippedByText() {
  return (
    <View>
      {/*
       * Inline View
       **/}
      <Text>
        The <Text style={{fontWeight: 'bold'}}>inline view</Text> below is
        taller than its Text parent and should be clipped.
      </Text>
      <Text
        style={{
          overflow: 'hidden',
          width: 150,
          height: 75,
          backgroundColor: 'lightgrey',
        }}>
        This is an inline view
        {/* Render a red border around the steelblue rectangle to make it clear how the inline view is being clipped */}
        <View style={{width: 50, height: 100, backgroundColor: 'red'}}>
          <View
            style={{
              width: 48,
              height: 98,
              left: 1,
              top: 1,
              backgroundColor: 'steelblue',
            }}
          />
        </View>
      </Text>

      {/*
       * Inline Image
       **/}
      <Text style={{marginTop: 10}}>
        The <Text style={{fontWeight: 'bold'}}>inline image</Text> below is
        taller than its Text parent and should be clipped.
      </Text>
      <Text
        style={{
          overflow: 'hidden',
          width: 175,
          height: 100,
          backgroundColor: 'lightgrey',
        }}>
        This is an inline image
        <Image
          source={{
            uri: 'https://picsum.photos/100',
            width: 50,
            height: 100,
          }}
          style={{
            width: 50,
            height: 100,
          }}
        />
      </Text>
    </View>
  );
}

type ChangeSizeState = {|
  width: number,
|};

class ChangeImageSize extends React.Component<*, ChangeSizeState> {
  state = {
    width: 50,
  };

  render() {
    return (
      <View>
        <TouchableHighlight
          onPress={() => {
            this.setState({width: this.state.width === 50 ? 100 : 50});
          }}>
          <Text style={{fontSize: 15}}>
            Change Image Width (width={this.state.width})
          </Text>
        </TouchableHighlight>
        <Text>
          This is an
          <Image
            source={{
              uri: 'https://picsum.photos/50',
              width: this.state.width,
              height: 50,
            }}
            style={{
              width: this.state.width,
              height: 50,
            }}
          />
          inline image
        </Text>
      </View>
    );
  }
}

class ChangeViewSize extends React.Component<*, ChangeSizeState> {
  state = {
    width: 50,
  };

  render() {
    return (
      <View>
        <TouchableHighlight
          onPress={() => {
            this.setState({width: this.state.width === 50 ? 100 : 50});
          }}>
          <Text style={{fontSize: 15}}>
            Change View Width (width={this.state.width})
          </Text>
        </TouchableHighlight>
        <Text>
          This is an
          <View
            style={{
              width: this.state.width,
              height: 50,
              backgroundColor: 'steelblue',
            }}
          />
          inline view
        </Text>
      </View>
    );
  }
}

class ChangeInnerViewSize extends React.Component<*, ChangeSizeState> {
  state = {
    width: 50,
  };

  render() {
    return (
      <View>
        <TouchableHighlight
          onPress={() => {
            this.setState({width: this.state.width === 50 ? 100 : 50});
          }}>
          {/* When updating `state.width`, it's important that the only thing that
              changes is the width of the pink inline view. When we do this, we
              demonstrate a bug in RN Android where the pink view doesn't get
              rerendered and remains at its old size. If other things change
              (e.g. we display `state.width` as text somewhere) it could circumvent
              the bug and cause the pink view to be rerendered at its new size. */}
          <Text style={{fontSize: 15}}>Change Pink View Width</Text>
        </TouchableHighlight>
        <Text>
          This is an
          <View style={{width: 125, height: 75, backgroundColor: 'steelblue'}}>
            <View
              style={{
                width: this.state.width,
                height: 50,
                backgroundColor: 'pink',
              }}
            />
          </View>
          inline view
        </Text>
      </View>
    );
  }
}

module.exports = {
  Basic,
  ClippedByText,
  ChangeImageSize,
  ChangeViewSize,
  ChangeInnerViewSize,
};
