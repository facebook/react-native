/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule YellowBox
 * @flow
 */

'use strict';

const EventEmitter = require('EventEmitter');
const Platform = require('Platform');
const React = require('React');
const StyleSheet = require('StyleSheet');

const infoLog = require('infoLog');
const openFileInEditor = require('openFileInEditor');
const parseErrorStack = require('parseErrorStack');
const symbolicateStackTrace = require('symbolicateStackTrace');

import type EmitterSubscription from 'EmitterSubscription';
import type {StackFrame} from 'parseErrorStack';

type WarningInfo = {
  count: number,
  stacktrace: Array<StackFrame>,
  symbolicated: boolean,
};

const _warningEmitter = new EventEmitter();
const _warningMap: Map<string, WarningInfo> = new Map();

/**
 * YellowBox renders warnings at the bottom of the app being developed.
 *
 * Warnings help guard against subtle yet significant issues that can impact the
 * quality of the app. This "in your face" style of warning allows developers to
 * notice and correct these issues as quickly as possible.
 *
 * By default, the warning box is enabled in `__DEV__`. Set the following flag
 * to disable it (and call `console.warn` to update any rendered <YellowBox>):
 *
 *   console.disableYellowBox = true;
 *   console.warn('YellowBox is disabled.');
 *
 * Warnings can be ignored programmatically by setting the array:
 *
 *   console.ignoredYellowBox = ['Warning: ...'];
 *
 * Strings in `console.ignoredYellowBox` can be a prefix of the warning that
 * should be ignored.
 */

if (__DEV__) {
  const {error, warn} = console;

  (console: any).error = function() {
    error.apply(console, arguments);
    // Show yellow box for the `warning` module.
    if (typeof arguments[0] === 'string' &&
        arguments[0].startsWith('Warning: ')) {
      updateWarningMap.apply(null, arguments);
    }
  };

  (console: any).warn = function() {
    warn.apply(console, arguments);

    if (typeof arguments[0] === 'string' &&
        arguments[0].startsWith('(ADVICE)')) {
      return;
    }

    updateWarningMap.apply(null, arguments);
  };

  if (Platform.isTesting) {
    (console: any).disableYellowBox = true;
  }
}

/**
 * Simple function for formatting strings.
 *
 * Replaces placeholders with values passed as extra arguments
 *
 * @param {string} format the base string
 * @param ...args the values to insert
 * @return {string} the replaced string
 */
function sprintf(format, ...args) {
  let index = 0;
  return format.replace(/%s/g, match => args[index++]);
}

function updateWarningMap(format, ...args): void {
  if (console.disableYellowBox) {
    return;
  }
  const stringifySafe = require('stringifySafe');

  format = String(format);
  const argCount = (format.match(/%s/g) || []).length;
  const warning = [
    sprintf(format, ...args.slice(0, argCount)),
    ...args.slice(argCount).map(stringifySafe),
  ].join(' ');

  const warningInfo = _warningMap.get(warning);
  if (warningInfo) {
    warningInfo.count += 1;
  } else {
    const error: any = new Error();
    error.framesToPop = 2;

    _warningMap.set(warning, {
      count: 1,
      stacktrace: parseErrorStack(error),
      symbolicated: false,
    });
  }

  _warningEmitter.emit('warning', _warningMap);
}

function ensureSymbolicatedWarning(warning: string): void {
  const prevWarningInfo = _warningMap.get(warning);
  if (!prevWarningInfo || prevWarningInfo.symbolicated) {
    return;
  }
  prevWarningInfo.symbolicated = true;

  symbolicateStackTrace(prevWarningInfo.stacktrace).then(
    stack => {
      const nextWarningInfo = _warningMap.get(warning);
      if (nextWarningInfo) {
        nextWarningInfo.stacktrace = stack;
        _warningEmitter.emit('warning', _warningMap);
      }
    },
    error => {
      const nextWarningInfo = _warningMap.get(warning);
      if (nextWarningInfo) {
        infoLog('Failed to symbolicate warning, "%s":', warning, error);
        _warningEmitter.emit('warning', _warningMap);
      }
    }
  );
}

function isWarningIgnored(warning: string): boolean {
  return (
    Array.isArray(console.ignoredYellowBox) &&
    console.ignoredYellowBox.some(
      ignorePrefix => warning.startsWith(String(ignorePrefix))
    )
  );
}

const WarningRow = ({count, warning, onPress}) => {
  const Text = require('Text');
  const TouchableHighlight = require('TouchableHighlight');
  const View = require('View');

  const countText = count > 1 ?
    <Text style={styles.listRowCount}>{'(' + count + ') '}</Text> :
    null;

  return (
    <View style={styles.listRow}>
      <TouchableHighlight
        activeOpacity={0.5}
        onPress={onPress}
        style={styles.listRowContent}
        underlayColor="transparent">
        <Text style={styles.listRowText} numberOfLines={2}>
          {countText}
          {warning}
        </Text>
      </TouchableHighlight>
    </View>
  );
};

type StackRowProps = { frame: StackFrame };
const StackRow = ({frame}: StackRowProps) => {
  const Text = require('Text');
  const TouchableHighlight = require('TouchableHighlight');
  const {file, lineNumber} = frame;
  const fileParts = file.split('/');
  const fileName = fileParts[fileParts.length - 1];

  return (
    <TouchableHighlight
      activeOpacity={0.5}
      style={styles.openInEditorButton}
      underlayColor="transparent"
      onPress={openFileInEditor.bind(null, file, lineNumber)}>
      <Text style={styles.inspectorCountText}>
        {fileName}:{lineNumber}
      </Text>
    </TouchableHighlight>
  );
};

const WarningInspector = ({
  warningInfo,
  warning,
  stacktraceVisible,
  onDismiss,
  onDismissAll,
  onMinimize,
  toggleStacktrace,
}) => {
  const ScrollView = require('ScrollView');
  const Text = require('Text');
  const TouchableHighlight = require('TouchableHighlight');
  const View = require('View');
  const {count, stacktrace} = warningInfo || {};

  const countSentence =
    'Warning encountered ' + count + ' time' + (count - 1 ? 's' : '') + '.';

  let stacktraceList;
  if (stacktraceVisible && stacktrace) {
    stacktraceList = (
      <View style={styles.stacktraceList}>
        {stacktrace.map((frame, ii) => <StackRow frame={frame} key={ii} />)}
      </View>
    );
  }

  return (
    <View style={styles.inspector}>
      <View style={styles.inspectorCount}>
        <Text style={styles.inspectorCountText}>{countSentence}</Text>
        <TouchableHighlight onPress={toggleStacktrace} underlayColor="transparent">
          <Text style={styles.inspectorButtonText}>
            {stacktraceVisible ? '▼' : '▶' } Stacktrace
          </Text>
        </TouchableHighlight>
      </View>
      <ScrollView style={styles.inspectorWarning}>
        {stacktraceList}
        <Text style={styles.inspectorWarningText}>{warning}</Text>
      </ScrollView>
      <View style={styles.inspectorButtons}>
        <TouchableHighlight
          activeOpacity={0.5}
          onPress={onMinimize}
          style={styles.inspectorButton}
          underlayColor="transparent">
          <Text style={styles.inspectorButtonText}>
            Minimize
          </Text>
        </TouchableHighlight>
        <TouchableHighlight
          activeOpacity={0.5}
          onPress={onDismiss}
          style={styles.inspectorButton}
          underlayColor="transparent">
          <Text style={styles.inspectorButtonText}>
            Dismiss
          </Text>
        </TouchableHighlight>
        <TouchableHighlight
          activeOpacity={0.5}
          onPress={onDismissAll}
          style={styles.inspectorButton}
          underlayColor="transparent">
          <Text style={styles.inspectorButtonText}>
            Dismiss All
          </Text>
        </TouchableHighlight>
      </View>
    </View>
  );
};

class YellowBox extends React.Component {
  state: {
    stacktraceVisible: boolean,
    inspecting: ?string,
    warningMap: Map<any, any>,
  };
  _listener: ?EmitterSubscription;
  dismissWarning: (warning: ?string) => void;

  constructor(props: mixed, context: mixed) {
    super(props, context);
    this.state = {
      inspecting: null,
      stacktraceVisible: false,
      warningMap: _warningMap,
    };
    this.dismissWarning = warning => {
      const {inspecting, warningMap} = this.state;
      if (warning) {
        warningMap.delete(warning);
      } else {
        warningMap.clear();
      }
      this.setState({
        inspecting: (warning && inspecting !== warning) ? inspecting : null,
        warningMap,
      });
    };
  }

  componentDidMount() {
    let scheduled = null;
    this._listener = _warningEmitter.addListener('warning', warningMap => {
      // Use `setImmediate` because warnings often happen during render, but
      // state cannot be set while rendering.
      scheduled = scheduled || setImmediate(() => {
        scheduled = null;
        this.setState({
          warningMap,
        });
      });
    });
  }

  componentDidUpdate() {
    const {inspecting} = this.state;
    if (inspecting != null) {
      ensureSymbolicatedWarning(inspecting);
    }
  }

  componentWillUnmount() {
    if (this._listener) {
      this._listener.remove();
    }
  }

  render() {
    if (console.disableYellowBox || this.state.warningMap.size === 0) {
      return null;
    }
    const ScrollView = require('ScrollView');
    const View = require('View');

    const {inspecting, stacktraceVisible} = this.state;
    const inspector = inspecting !== null ?
      <WarningInspector
        warningInfo={this.state.warningMap.get(inspecting)}
        warning={inspecting}
        stacktraceVisible={stacktraceVisible}
        onDismiss={() => this.dismissWarning(inspecting)}
        onDismissAll={() => this.dismissWarning(null)}
        onMinimize={() => this.setState({inspecting: null})}
        toggleStacktrace={() => this.setState({stacktraceVisible: !stacktraceVisible})}
      /> :
      null;

    const rows = [];
    this.state.warningMap.forEach((warningInfo, warning) => {
      if (!isWarningIgnored(warning)) {
        rows.push(
          <WarningRow
            key={warning}
            count={warningInfo.count}
            warning={warning}
            onPress={() => this.setState({inspecting: warning})}
            onDismiss={() => this.dismissWarning(warning)}
          />
        );
      }
    });

    const listStyle = [
      styles.list,
      // Additional `0.4` so the 5th row can peek into view.
      {height: Math.min(rows.length, 4.4) * (rowGutter + rowHeight)},
    ];
    return (
      <View style={inspector ? styles.fullScreen : listStyle}>
        <ScrollView style={listStyle} scrollsToTop={false}>
          {rows}
        </ScrollView>
        {inspector}
      </View>
    );
  }
}

const backgroundColor = opacity => 'rgba(250, 186, 48, ' + opacity + ')';
const textColor = 'white';
const rowGutter = 1;
const rowHeight = 46;

// For unknown reasons, setting elevation: Number.MAX_VALUE causes remote debugging to
// hang on iOS (some sort of overflow maybe). Setting it to Number.MAX_SAFE_INTEGER fixes
// the iOS issue, but since elevation is an Android-only style property we should only
// use it on Android.
// See: https://github.com/facebook/react-native/issues/12223
const elevation = Platform.OS === 'android' ? Number.MAX_SAFE_INTEGER : undefined;

var styles = StyleSheet.create({
  fullScreen: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    elevation: elevation,
  },
  inspector: {
    backgroundColor: backgroundColor(0.95),
    flex: 1,
    paddingTop: 5,
    elevation: elevation,
  },
  inspectorButtons: {
    flexDirection: 'row',
  },
  inspectorButton: {
    flex: 1,
    paddingVertical: 22,
    backgroundColor: backgroundColor(1),
  },
  stacktraceList: {
    paddingBottom: 5,
  },
  inspectorButtonText: {
    color: textColor,
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
  },
  openInEditorButton: {
    paddingTop: 5,
    paddingBottom: 5,
  },
  inspectorCount: {
    padding: 15,
    paddingBottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inspectorCountText: {
    color: textColor,
    fontSize: 14,
  },
  inspectorWarning: {
    flex: 1,
    paddingHorizontal: 15,
  },
  inspectorWarningText: {
    color: textColor,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: elevation,
  },
  listRow: {
    position: 'relative',
    backgroundColor: backgroundColor(0.95),
    flex: 1,
    height: rowHeight,
    marginTop: rowGutter,
  },
  listRowContent: {
    flex: 1,
  },
  listRowCount: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  listRowText: {
    color: textColor,
    position: 'absolute',
    left: 0,
    top: Platform.OS === 'android' ? 5 : 7,
    marginLeft: 15,
    marginRight: 15,
  },
});

module.exports = YellowBox;
