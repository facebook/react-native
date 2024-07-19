/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 * @oncall react_native
 */

'use strict';

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterButton from '../../components/RNTesterButton';
import RNTesterPage from '../../components/RNTesterPage';
import * as performanceComparisonExamples from './performanceComparisonExamples';
import * as React from 'react';
import {StyleSheet, Text, View} from 'react-native';

const {useState, useCallback, useMemo} = React;
const SHOW_NOTHING = 'SHOW_NOTHING';
const SHOW_GOOD_EXAMPLE = 'SHOW_GOOD_EXAMPLE';
const SHOW_BAD_EXAMPLE = 'SHOW_BAD_EXAMPLE';

function PerfExampleWrapper(props: {
  badExample: React.Node,
  goodExample: React.Node,
  badExampleScript?: string,
  goodExampleScript?: string,
}): React.Node {
  const {badExample, goodExample, badExampleScript, goodExampleScript} = props;
  const [loadExample, setLoadExample] = useState(SHOW_NOTHING);
  const toggleGoodExample = useCallback(
    () =>
      setLoadExample(
        loadExample === SHOW_GOOD_EXAMPLE ? SHOW_NOTHING : SHOW_GOOD_EXAMPLE,
      ),
    [setLoadExample, loadExample],
  );
  const toggleBadExample = useCallback(
    () =>
      setLoadExample(
        loadExample === SHOW_BAD_EXAMPLE ? SHOW_NOTHING : SHOW_BAD_EXAMPLE,
      ),
    [setLoadExample, loadExample],
  );

  const badExampleContents = useMemo(() => {
    const result: React.Node[] = [];
    if (loadExample === SHOW_BAD_EXAMPLE) {
      if (badExampleScript != null) {
        result.push(<Text key="1">{badExampleScript}</Text>);
      }
      result.push(<View key="2">{badExample}</View>);
    }
    return result;
  }, [loadExample, badExample, badExampleScript]);

  const goodExampleContents = useMemo(() => {
    const result: React.Node[] = [];
    if (loadExample === SHOW_GOOD_EXAMPLE) {
      if (goodExampleScript != null) {
        result.push(<Text key="1">{goodExampleScript}</Text>);
      }
      result.push(<View key="2">{goodExample}</View>);
    }
    return result;
  }, [loadExample, goodExample, goodExampleScript]);

  return (
    <RNTesterPage noScroll={true}>
      <View style={styles.container}>
        <View style={styles.controls}>
          <RNTesterButton onPress={toggleBadExample}>
            {loadExample === SHOW_BAD_EXAMPLE ? 'Hide Bad' : 'Show Bad'}
          </RNTesterButton>
          <RNTesterButton onPress={toggleGoodExample}>
            {loadExample === SHOW_GOOD_EXAMPLE ? 'Hide Good' : 'Show Good'}
          </RNTesterButton>
        </View>
        <View style={styles.exampleContainer}>
          {loadExample === SHOW_BAD_EXAMPLE
            ? badExampleContents
            : loadExample === SHOW_GOOD_EXAMPLE
              ? goodExampleContents
              : null}
        </View>
      </View>
    </RNTesterPage>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 5,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'gray',
    marginBottom: 5,
  },
  exampleContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  perfExampleContainer: {},
});

exports.title = 'Performance Comparison Examples';
exports.category = 'Basic';
exports.description =
  'Compare performance with bad and good examples. Use React DevTools to highlight re-renders is recommended.';

const examples: Array<RNTesterModuleExample> = Object.keys(
  performanceComparisonExamples,
).map(name => {
  const example = performanceComparisonExamples[name];
  return {
    title: example.title,
    description: example.description,
    render: () => (
      <PerfExampleWrapper
        badExample={<example.Bad />}
        goodExample={<example.Good />}
      />
    ),
  };
});

exports.examples = examples;
