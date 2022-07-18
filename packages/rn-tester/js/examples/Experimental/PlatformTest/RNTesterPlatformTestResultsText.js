/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import {Text, StyleSheet} from 'react-native';
import * as React from 'react';

type Props = $ReadOnly<{
  numPass: number,
  numFail: number,
  numError: number,
  numPending: number,
  numSkipped: number,
}>;
export default function RNTesterPlatformTestResultsText(
  props: Props,
): React.MixedElement {
  const {numPass, numFail, numError, numPending, numSkipped} = props;
  return (
    <>
      <Text>
        {numPass} <Text style={styles.passText}>Pass</Text>
      </Text>
      {'  '}
      <Text>
        {numFail} <Text style={styles.failText}>Fail</Text>
      </Text>
      {numSkipped > 0 ? (
        <>
          {'  '}
          <Text>
            {numSkipped} <Text style={styles.skippedText}>Skipped</Text>
          </Text>
        </>
      ) : null}
      {numError > 0 ? (
        <>
          {'  '}
          <Text>
            {numError} <Text style={styles.errorText}>Error</Text>
          </Text>
        </>
      ) : null}
      {numPending > 0 ? (
        <>
          {' '}
          <Text>
            {numPending} <Text style={styles.pendingText}>Pending</Text>
          </Text>
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: 'orange',
  },
  failText: {
    color: 'red',
  },
  passText: {
    color: 'green',
  },
  pendingText: {
    color: 'gray',
  },
  skippedText: {
    color: 'blue',
  },
});
