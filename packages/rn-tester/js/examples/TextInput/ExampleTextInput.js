/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import {RNTesterThemeContext} from '../../components/RNTesterTheme';
import React, {useContext} from 'react';
import {StyleSheet, TextInput} from 'react-native';

const ExampleTextInput: component(
  ref: React.RefSetter<null | React.ElementRef<typeof TextInput>>,
  ...props: React.ElementConfig<typeof TextInput>
) = ({
  ref,
  ...props
}: {
  ref?: React.RefSetter<null | React.ElementRef<typeof TextInput>>,
  ...React.ElementConfig<typeof TextInput>,
}) => {
  const theme = useContext(RNTesterThemeContext);

  return (
    <TextInput
      ref={ref}
      {...props}
      style={[
        {
          color: theme.LabelColor,
          backgroundColor: theme.SecondaryGroupedBackgroundColor,
          borderColor: theme.QuaternaryLabelColor,
        },
        styles.input,
        props.style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    fontSize: 13,
    flexGrow: 1,
    flexShrink: 1,
    padding: 4,
  },
});

export default ExampleTextInput;
