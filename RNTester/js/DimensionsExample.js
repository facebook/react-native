/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DimensionsExample
 * @flow
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  Dimensions,
  Text,
  View
} = ReactNative;

class DimensionsSubscription extends React.Component<{dim: string}, {dims: Object}> {
  state = {
    dims: Dimensions.get(this.props.dim),
  };

  componentDidMount() {
    Dimensions.addEventListener('change', this._handleDimensionsChange);
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._handleDimensionsChange);
  }

  _handleDimensionsChange = (dimensions) => {
    this.setState({
      dims: dimensions[this.props.dim],
    });
  };

  render() {
    return (
      <View>
        <Text>{JSON.stringify(this.state.dims)}</Text>
      </View>
    );
  }
}

exports.title = 'Dimensions';
exports.description = 'Dimensions of the viewport';
exports.examples = [
  {
    title: 'window',
    render(): React.Element<any> { return <DimensionsSubscription dim="window" />; }
  },
  {
    title: 'screen',
    render(): React.Element<any> { return <DimensionsSubscription dim="screen" />; }
  },
];
