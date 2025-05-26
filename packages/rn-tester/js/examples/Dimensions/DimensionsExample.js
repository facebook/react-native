/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import RNTesterText from '../../components/RNTesterText';
import React, {useEffect, useState} from 'react';
import {Dimensions, useWindowDimensions} from 'react-native';

type Props = {dim: string};

function DimensionsSubscription(props: Props) {
  const [dims, setDims] = useState(() => Dimensions.get(props.dim));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', dimensions => {
      setDims(dimensions[props.dim]);
    });

    return () => subscription.remove();
  }, [props.dim]);

  return (
    <RNTesterText variant="label">{JSON.stringify(dims, null, 2)}</RNTesterText>
  );
}

const DimensionsViaHook = () => {
  const dims = useWindowDimensions();
  return (
    <RNTesterText variant="label">{JSON.stringify(dims, null, 2)}</RNTesterText>
  );
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
    render(): React.MixedElement {
      return <DimensionsSubscription dim="window" />;
    },
  },
  {
    title: 'Non-component `get` API: screen',
    render(): React.MixedElement {
      return <DimensionsSubscription dim="screen" />;
    },
  },
];
