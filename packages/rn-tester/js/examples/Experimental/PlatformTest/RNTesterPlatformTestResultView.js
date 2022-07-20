/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {
  ViewStyleProp,
  TextStyle,
} from 'react-native/Libraries/StyleSheet/StyleSheet';
import type {
  PlatformTestResult,
  PlatformTestResultStatus,
} from './RNTesterPlatformTestTypes';

import * as React from 'react';
import {useMemo} from 'react';
import {Button, View, Text, StyleSheet} from 'react-native';

const DISPLAY_STATUS_MAPPING: {[PlatformTestResultStatus]: string} = {
  PASS: 'Pass',
  FAIL: 'Fail',
  ERROR: 'Error',
};

type Props = $ReadOnly<{|
  reset: () => void,
  results: $ReadOnlyArray<PlatformTestResult>,
  style?: ?ViewStyleProp,
|}>;
export default function RNTesterPlatformTestResultView(
  props: Props,
): React.MixedElement {
  const {reset, results, style} = props;

  const {numPass, numFail, numError} = useMemo(
    () =>
      results.reduce(
        (acc, result) => {
          switch (result.status) {
            case 'PASS':
              return {...acc, numPass: acc.numPass + 1};
            case 'FAIL':
              return {...acc, numFail: acc.numFail + 1};
            case 'ERROR':
              return {...acc, numError: acc.numError + 1};
          }
        },
        {
          numPass: 0,
          numFail: 0,
          numError: 0,
        },
      ),
    [results],
  );

  return (
    <View style={style}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Results</Text>
        <Button title="Reset" onPress={reset} />
      </View>

      <Text style={styles.summaryContainer}>
        <Text>
          {numPass} <Text style={styles.passText}>Pass</Text>
        </Text>
        {'  '}
        <Text>
          {numFail} <Text style={styles.failText}>Fail</Text>
        </Text>
        {'  '}
        <Text>
          {numError} <Text style={styles.errorText}>Error</Text>
        </Text>
      </Text>

      <View style={styles.table}>
        {/* Table Heading Row */}
        <View style={styles.tableRow}>
          <View style={[styles.tableHeaderColumn, styles.tableResultColumn]}>
            <Text style={styles.tableHeader}>Result</Text>
          </View>
          <View style={[styles.tableHeaderColumn, styles.tableTestNameColumn]}>
            <Text style={styles.tableHeader}>Test Name</Text>
          </View>
          <View style={[styles.tableHeaderColumn, styles.tableMessageColumn]}>
            <Text style={styles.tableHeader}>Message</Text>
          </View>
        </View>

        {/* Table Contents */}
        {results.map((testResult, resultIdx) => {
          return (
            <View key={resultIdx} style={styles.tableRow}>
              <View style={styles.tableResultColumn}>
                <Text style={STATUS_TEXT_STYLE_MAPPING[testResult.status]}>
                  {DISPLAY_STATUS_MAPPING[testResult.status]}
                </Text>
              </View>
              <View style={styles.tableTestNameColumn}>
                <Text>{testResult.name}</Text>
              </View>
              <View style={styles.tableMessageColumn}>
                {testResult.assertions.map((assertion, assertionIdx) => {
                  if (assertion.passing) {
                    return null;
                  }
                  return (
                    <Text key={assertionIdx}>
                      {assertion.name}: {assertion.description}{' '}
                      {assertion.failureMessage}
                    </Text>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
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
  table: {},
  tableHeader: {
    fontSize: 16,
    fontWeight: '700',
  },
  tableHeaderColumn: {
    alignItems: 'center',
  },
  tableMessageColumn: {
    flex: 2.5,
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  tableResultColumn: {
    flex: 0.5,
    justifyContent: 'center',
  },
  tableTestNameColumn: {
    flex: 2,
    justifyContent: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

const STATUS_TEXT_STYLE_MAPPING: {[PlatformTestResultStatus]: TextStyle} = {
  PASS: styles.passText,
  FAIL: styles.failText,
  ERROR: styles.errorText,
};
