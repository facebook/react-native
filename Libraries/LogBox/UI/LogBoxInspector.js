/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import Platform from '../../Utilities/Platform';
import * as React from 'react';
import ScrollView from '../../Components/ScrollView/ScrollView';
import StyleSheet from '../../StyleSheet/StyleSheet';
import View from '../../Components/View/View';
import LogBoxInspectorFooter from './LogBoxInspectorFooter';
import LogBoxInspectorMessageHeader from './LogBoxInspectorMessageHeader';
import LogBoxInspectorReactFrames from './LogBoxInspectorReactFrames';
import LogBoxInspectorStackFrames from './LogBoxInspectorStackFrames';
import LogBoxInspectorMeta from './LogBoxInspectorMeta';
import LogBoxInspectorHeader from './LogBoxInspectorHeader';
import * as LogBoxStyle from './LogBoxStyle';

import type LogBoxLog from '../Data/LogBoxLog';
import type {SymbolicationRequest} from '../Data/LogBoxLog';

type Props = $ReadOnly<{|
  onDismiss: () => void,
  onChangeSelectedIndex: (index: number) => void,
  onMinimize: () => void,
  logs: $ReadOnlyArray<LogBoxLog>,
  selectedIndex: number,
|}>;

class LogBoxInspector extends React.Component<Props> {
  _symbolication: ?SymbolicationRequest;

  _handleDismiss = () => {
    this.props.onDismiss();
  };

  render(): React.Node {
    const {logs, selectedIndex} = this.props;

    const log = logs[selectedIndex];
    if (log == null) {
      return null;
    }

    return (
      <View style={styles.root}>
        <LogBoxInspectorHeader
          onSelectIndex={this._handleSelectIndex}
          selectedIndex={selectedIndex}
          total={logs.length}
        />
        <LogBoxInspectorBody
          log={log}
          onRetry={this._handleRetrySymbolication}
        />
        <LogBoxInspectorFooter
          onDismiss={this._handleDismiss}
          onMinimize={this.props.onMinimize}
        />
      </View>
    );
  }

  componentDidMount(): void {
    this._handleSymbolication();
  }

  componentDidUpdate(prevProps: Props): void {
    if (
      prevProps.logs[prevProps.selectedIndex] !==
      this.props.logs[this.props.selectedIndex]
    ) {
      this._handleSymbolication();
    }
  }

  _handleRetrySymbolication = () => {
    this.forceUpdate(() => {
      const log = this.props.logs[this.props.selectedIndex];
      this._symbolication = log.retrySymbolicate(() => {
        this.forceUpdate();
      });
    });
  };

  _handleSymbolication(): void {
    const log = this.props.logs[this.props.selectedIndex];
    if (log.symbolicated.status !== 'COMPLETE') {
      this._symbolication = log.symbolicate(() => {
        this.forceUpdate();
      });
    }
  }

  _handleSelectIndex = (selectedIndex: number): void => {
    this.props.onChangeSelectedIndex(selectedIndex);
  };
}

function LogBoxInspectorBody(props) {
  const [collapsed, setCollapsed] = React.useState(true);
  if (collapsed) {
    return (
      <>
        <LogBoxInspectorMessageHeader
          collapsed={collapsed}
          onPress={() => setCollapsed(!collapsed)}
          message={props.log.message}
        />
        <ScrollView style={styles.scrollBody}>
          <LogBoxInspectorReactFrames log={props.log} />
          <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
          <LogBoxInspectorMeta />
        </ScrollView>
      </>
    );
  }
  return (
    <ScrollView style={styles.scrollBody}>
      <LogBoxInspectorMessageHeader
        collapsed={collapsed}
        onPress={() => setCollapsed(!collapsed)}
        message={props.log.message}
      />
      <LogBoxInspectorReactFrames log={props.log} />
      <LogBoxInspectorStackFrames log={props.log} onRetry={props.onRetry} />
      <LogBoxInspectorMeta />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: LogBoxStyle.getTextColor(1),
    elevation: Platform.OS === 'android' ? Number.MAX_SAFE_INTEGER : undefined,
    height: '100%',
  },
  scrollBody: {
    backgroundColor: LogBoxStyle.getBackgroundColor(0.9),
    flex: 1,
  },
});

export default LogBoxInspector;
