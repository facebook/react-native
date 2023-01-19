/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {Dimensions, Text, useWindowDimensions} from 'react-native';
import * as React from 'react';
import {useState, useEffect} from 'react';

type Props = {dim: string};

function DimensionsSubscription(props: Props) {
  const [dims, setDims] = useState(() => Dimensions.get(props.dim));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', dimensions => {
      setDims(dimensions[props.dim]);
    });

    return () => subscription.remove();
  }, [props.dim]);

  return <Text>{JSON.stringify(dims, null, 2)}</Text>;
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
