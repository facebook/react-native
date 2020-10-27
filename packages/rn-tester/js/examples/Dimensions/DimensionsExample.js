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

import {Dimensions, Text, useWindowDimensions} from 'react-native';
import * as React from 'react';

class DimensionsSubscription extends React.Component<
  {dim: string, ...},
  {dims: Object, ...},
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
    return <Text>{JSON.stringify(this.state.dims, null, 2)}</Text>;
  }
}

exports.title = 'Dimensions';
exports.category = 'UI';
exports.documentationURL = 'https://reactnative.dev/docs/dimensions';
exports.description = 'Dimensions of the viewport';
exports.examples = [
  {
    title: 'useWindowDimensions hook',
    render(): React.Node {
      const DimensionsViaHook = () => {
        const dims = useWindowDimensions();
        return <Text>{JSON.stringify(dims, null, 2)}</Text>;
      };
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
