/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {EventSubscription} from 'react-native/Libraries/vendor/emitter/EventEmitter';
import {Dimensions, Text, useWindowDimensions} from 'react-native';
import * as React from 'react';

class DimensionsSubscription extends React.Component<
  {dim: string, ...},
  {dims: Object, ...},
> {
  state = {
    dims: Dimensions.get(this.props.dim),
  };

  _dimensionsSubscription: ?EventSubscription;

  componentDidMount() {
    this._dimensionsSubscription = Dimensions.addEventListener(
      'change',
      dimensions => {
        this.setState({
          dims: dimensions[this.props.dim],
        });
      },
    );
  }

  componentWillUnmount() {
    this._dimensionsSubscription?.remove();
  }

  render() {
    return <Text>{JSON.stringify(this.state.dims, null, 2)}</Text>;
  }
}

const DimensionsViaHook = () => {
  const dims = useWindowDimensions();
  return <Text>{JSON.stringify(dims, null, 2)}</Text>;
};

exports.title = 'Dimensions';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/dimensions';
exports.description = 'Dimensions of the viewport';
exports.examples = [
  {
    title: 'useWindowDimensions hook',
    render(): React.Node {
      return <DimensionsViaHook />;
    },
  },
  {
    title: 'Non-component `get` API: window',
    render(): React.Element<any> {
      return <DimensionsSubscription dim="window" />;
    },
  },
  {
    title: 'Non-component `get` API: screen',
    render(): React.Element<any> {
      return <DimensionsSubscription dim="screen" />;
    },
  },
];
