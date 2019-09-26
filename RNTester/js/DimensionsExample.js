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
const {Dimensions, Text, View} = require('react-native');

class DimensionsSubscription extends React.Component<
  {dim: string},
  {dims: Object},
> {
  state = {
    dims: Dimensions.get(this.props.dim),
  };

  componentDidMount() {
    Dimensions.addEventListener('change', this._handleDimensionsChange);
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._handleDimensionsChange);
  }

  _handleDimensionsChange = dimensions => {
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
    render(): React.Element<any> {
      return <DimensionsSubscription dim="window" />;
    },
  },
  {
    title: 'screen',
    render(): React.Element<any> {
      return <DimensionsSubscription dim="screen" />;
    },
  },
];
