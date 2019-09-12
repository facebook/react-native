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

const Platform = require('../../Utilities/Platform');
const React = require('react');
const ScrollView = require('../../Components/ScrollView/ScrollView');
const StyleSheet = require('../../StyleSheet/StyleSheet');
const Text = require('../../Text/Text');
const View = require('../../Components/View/View');
const YellowBoxCategory = require('../Data/YellowBoxCategory');
const YellowBoxInspectorFooter = require('./YellowBoxInspectorFooter');
const YellowBoxInspectorHeader = require('./YellowBoxInspectorHeader');
const YellowBoxInspectorSourceMapStatus = require('./YellowBoxInspectorSourceMapStatus');
const YellowBoxInspectorStackFrame = require('./YellowBoxInspectorStackFrame');
const YellowBoxStyle = require('./YellowBoxStyle');

const openFileInEditor = require('../../Core/Devtools/openFileInEditor');

import type YellowBoxWarning from '../Data/YellowBoxWarning';
import type {SymbolicationRequest} from '../Data/YellowBoxWarning';

type Props = $ReadOnly<{|
  onDismiss: () => void,
  onMinimize: () => void,
  warnings: $ReadOnlyArray<YellowBoxWarning>,
|}>;

type State = {|
  selectedIndex: number,
|};

class YellowBoxInspector extends React.Component<Props, State> {
  _symbolication: ?SymbolicationRequest;

  state: State = {
    selectedIndex: 0,
  };

  render(): React.Node {
    const {warnings} = this.props;
    const {selectedIndex} = this.state;

    const warning = warnings[selectedIndex];

    return (
      <View style={styles.root}>
        <YellowBoxInspectorHeader
          onSelectIndex={this._handleSelectIndex}
          selectedIndex={selectedIndex}
          warnings={warnings}
        />
        <ScrollView
          contentContainerStyle={styles.bodyContent}
          key={selectedIndex}
          style={styles.body}>
          <View>
            <View style={styles.bodyHeading}>
              <Text style={styles.bodyHeadingText}>Warning</Text>
            </View>
            <Text style={styles.bodyText}>
              {YellowBoxCategory.render(
                warning.message,
                styles.substitutionText,
              )}
            </Text>
          </View>
          <View style={styles.bodySection}>
            <View style={styles.bodyHeading}>
              <Text style={styles.bodyHeadingText}>Stack</Text>
              <YellowBoxInspectorSourceMapStatus
                onPress={
                  warning.symbolicated.status === 'FAILED'
                    ? this._handleRetrySymbolication
                    : null
                }
                status={warning.symbolicated.status}
              />
            </View>
            {warning.getAvailableStack().map((frame, index) => {
              const {file, lineNumber} = frame;
              return (
                <YellowBoxInspectorStackFrame
                  key={index}
                  frame={frame}
                  onPress={
                    warning.symbolicated.status === 'COMPLETE' &&
                    file != null &&
                    lineNumber != null
                      ? () => {
                          openFileInEditor(file, lineNumber);
                        }
                      : null
                  }
                />
              );
            })}
          </View>
        </ScrollView>
        <YellowBoxInspectorFooter
          onDismiss={this.props.onDismiss}
          onMinimize={this.props.onMinimize}
        />
      </View>
    );
  }

  componentDidMount(): void {
    this._handleSymbolication();
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    if (
      prevProps.warnings !== this.props.warnings ||
      prevState.selectedIndex !== this.state.selectedIndex
    ) {
      this._cancelSymbolication();
      this._handleSymbolication();
    }
  }

  componentWillUnmount(): void {
    this._cancelSymbolication();
  }

  _handleRetrySymbolication = () => {
    this._cancelSymbolication();
    this.forceUpdate(() => {
      const warning = this.props.warnings[this.state.selectedIndex];
      this._symbolication = warning.retrySymbolicate(() => {
        this.forceUpdate();
      });
    });
  };

  _handleSymbolication(): void {
    const warning = this.props.warnings[this.state.selectedIndex];
    if (warning.symbolicated.status !== 'COMPLETE') {
      this._symbolication = warning.symbolicate(() => {
        this.forceUpdate();
      });
    }
  }

  _cancelSymbolication(): void {
    if (this._symbolication != null) {
      this._symbolication.abort();
      this._symbolication = null;
    }
  }

  _handleSelectIndex = (selectedIndex: number): void => {
    this.setState({selectedIndex});
  };
}

const styles = StyleSheet.create({
  root: {
    elevation: Platform.OS === 'android' ? Number.MAX_SAFE_INTEGER : undefined,
    height: '100%',
  },
  body: {
    backgroundColor: YellowBoxStyle.getBackgroundColor(0.95),
    borderBottomColor: YellowBoxStyle.getDividerColor(0.95),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderTopColor: YellowBoxStyle.getDividerColor(0.95),
    borderTopWidth: StyleSheet.hairlineWidth,
    flex: 1,
  },
  bodyContent: {
    paddingVertical: 12,
  },
  bodyHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 12,
  },
  bodyHeadingText: {
    color: YellowBoxStyle.getTextColor(1),
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 28,
  },
  bodyText: {
    color: YellowBoxStyle.getTextColor(1),
    fontSize: 14,
    includeFontPadding: false,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  substitutionText: {
    color: YellowBoxStyle.getTextColor(0.6),
  },
  bodySection: {
    marginTop: 20,
  },
});

module.exports = YellowBoxInspector;
