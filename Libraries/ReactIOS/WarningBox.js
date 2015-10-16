/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WarningBox
 */
'use strict';

var AsyncStorage = require('AsyncStorage');
var EventEmitter = require('EventEmitter');
var Map = require('Map');
var PanResponder = require('PanResponder');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Text = require('Text');
var TouchableOpacity = require('TouchableOpacity');
var View = require('View');

var invariant = require('invariant');
var rebound = require('rebound');
var stringifySafe = require('stringifySafe');

var SCREEN_WIDTH = require('Dimensions').get('window').width;
var IGNORED_WARNINGS_KEY = '__DEV_WARNINGS_IGNORED';

var consoleWarn = console.warn.bind(console);

var warningCounts = new Map();
var ignoredWarnings: Array<string> = [];
var totalWarningCount = 0;
var warningCountEvents = new EventEmitter();

/**
 * WarningBox renders warnings on top of the app being developed. Warnings help
 * guard against subtle yet significant issues that can impact the quality of
 * your application, such as accessibility and memory leaks. This "in your
 * face" style of warning allows developers to notice and correct these issues
 * as quickly as possible.
 *
 * The warning box is currently opt-in. Set the following flag to enable it:
 *
 * `console.yellowBoxEnabled = true;`
 *
 * If "ignore" is tapped on a warning, the WarningBox will record that warning
 * and will not display it again. This is useful for hiding errors that already
 * exist or have been introduced elsewhere. To re-enable all of the errors, set
 * the following:
 *
 * `console.yellowBoxResetIgnored = true;`
 *
 * This can also be set permanently, and ignore will only silence the warnings
 * until the next refresh.
 */

if (__DEV__) {
  console.warn = function() {
    consoleWarn.apply(null, arguments);
    if (!console.yellowBoxEnabled) {
      return;
    }
    var warning = Array.prototype.map.call(arguments, stringifySafe).join(' ');
    if (!console.yellowBoxResetIgnored &&
        ignoredWarnings.indexOf(warning) !== -1) {
      return;
    }
    var count = warningCounts.has(warning) ? warningCounts.get(warning) + 1 : 1;
    warningCounts.set(warning, count);
    totalWarningCount += 1;
    warningCountEvents.emit('count', totalWarningCount);
  };
}

function saveIgnoredWarnings() {
  AsyncStorage.setItem(
    IGNORED_WARNINGS_KEY,
    JSON.stringify(ignoredWarnings),
    function(err) {
      if (err) {
        console.warn('Could not save ignored warnings.', err);
      }
    }
  );
}

AsyncStorage.getItem(IGNORED_WARNINGS_KEY, function(err, data) {
  if (!err && data && !console.yellowBoxResetIgnored) {
    ignoredWarnings = JSON.parse(data);
  }
});

var WarningRow = React.createClass({
  componentWillMount: function() {
    this.springSystem = new rebound.SpringSystem();
    this.dismissalSpring = this.springSystem.createSpring();
    this.dismissalSpring.setRestSpeedThreshold(0.05);
    this.dismissalSpring.setCurrentValue(0);
    this.dismissalSpring.addListener({
      onSpringUpdate: () => {
        var val = this.dismissalSpring.getCurrentValue();
        this.text && this.text.setNativeProps({
          left: SCREEN_WIDTH * val,
        });
        this.container && this.container.setNativeProps({
          opacity: 1 - val,
        });
        this.closeButton && this.closeButton.setNativeProps({
          opacity: 1 - (val * 5),
        });
      },
      onSpringAtRest: () => {
        if (this.dismissalSpring.getCurrentValue()) {
          this.collapseSpring.setEndValue(1);
        }
      },
    });
    this.collapseSpring = this.springSystem.createSpring();
    this.collapseSpring.setRestSpeedThreshold(0.05);
    this.collapseSpring.setCurrentValue(0);
    this.collapseSpring.getSpringConfig().friction = 20;
    this.collapseSpring.getSpringConfig().tension = 200;
    this.collapseSpring.addListener({
      onSpringUpdate: () => {
        var val = this.collapseSpring.getCurrentValue();
        this.container && this.container.setNativeProps({
          height: Math.abs(46 - (val * 46)),
        });
      },
      onSpringAtRest: () => {
        this.props.onDismissed();
      },
    });
    this.panGesture = PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return !!this.dismissalSpring.getCurrentValue();
      },
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        this.isResponderOnlyToBlockTouches =
          !!this.dismissalSpring.getCurrentValue();
      },
      onPanResponderMove: (e, gestureState) => {
        if (this.isResponderOnlyToBlockTouches) {
          return;
        }
        this.dismissalSpring.setCurrentValue(gestureState.dx / SCREEN_WIDTH);
      },
      onPanResponderRelease: (e, gestureState) => {
        if (this.isResponderOnlyToBlockTouches) {
          return;
        }
        var gestureCompletion = gestureState.dx / SCREEN_WIDTH;
        var doesGestureRelease = (gestureState.vx + gestureCompletion) > 0.5;
        this.dismissalSpring.setEndValue(doesGestureRelease ? 1 : 0);
      }
    });
  },
  render: function() {
    var countText;
    if (warningCounts.get(this.props.warning) > 1) {
      countText = (
        <Text style={styles.bold}>
          ({warningCounts.get(this.props.warning)}){" "}
        </Text>
      );
    }
    return (
      <View
        style={styles.warningBox}
        ref={container => { this.container = container; }}
        {...this.panGesture.panHandlers}>
        <TouchableOpacity
          onPress={this.props.onOpened}>
          <Text
            style={styles.warningText}
            numberOfLines={2}
            ref={text => { this.text = text; }}>
            {countText}
            {this.props.warning}
          </Text>
        </TouchableOpacity>
        <View
          ref={closeButton => { this.closeButton = closeButton; }}
          style={styles.closeButton}>
          <TouchableOpacity
            onPress={() => {
              this.dismissalSpring.setEndValue(1);
            }}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
});

var WarningBoxOpened = React.createClass({
  render: function() {
    var countText;
    if (warningCounts.get(this.props.warning) > 1) {
      countText = (
        <Text style={styles.bold}>
          ({warningCounts.get(this.props.warning)}){" "}
        </Text>
      );
    }
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={this.props.onClose}
        style={styles.yellowBox}>
        <Text style={styles.yellowBoxText}>
          {countText}
          {this.props.warning}
        </Text>
        <View style={styles.yellowBoxButtons}>
          <TouchableOpacity
            onPress={this.props.onDismissed}
            style={styles.yellowBoxButton}>
            <Text style={styles.yellowBoxButtonText}>
              Dismiss
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={this.props.onIgnored}
            style={styles.yellowBoxButton}>
            <Text style={styles.yellowBoxButtonText}>
              Ignore
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  },
});

var canMountWarningBox = true;

var WarningBox = React.createClass({
  getInitialState: function() {
    return {
      totalWarningCount,
      openWarning: null,
    };
  },
  componentWillMount: function() {
    if (console.yellowBoxResetIgnored) {
      AsyncStorage.setItem(IGNORED_WARNINGS_KEY, '[]', function(err) {
        if (err) {
          console.warn('Could not reset ignored warnings.', err);
        }
      });
      ignoredWarnings = [];
    }
  },
  componentDidMount: function() {
    invariant(
      canMountWarningBox,
      'There can only be one WarningBox'
    );
    canMountWarningBox = false;
    warningCountEvents.addListener(
      'count',
      this._onWarningCount
    );
  },
  componentWillUnmount: function() {
    warningCountEvents.removeAllListeners();
    canMountWarningBox = true;
  },
  _onWarningCount: function(totalWarningCount) {
    // Must use setImmediate because warnings often happen during render and
    // state cannot be set while rendering
    setImmediate(() => {
      this.setState({ totalWarningCount, });
    });
  },
  _onDismiss: function(warning) {
    warningCounts.delete(warning);
    this.setState({
      openWarning: null,
    });
  },
  render: function() {
    if (warningCounts.size === 0) {
      return <View />;
    }
    if (this.state.openWarning) {
      return (
        <WarningBoxOpened
          warning={this.state.openWarning}
          onClose={() => {
            this.setState({ openWarning: null });
          }}
          onDismissed={this._onDismiss.bind(this, this.state.openWarning)}
          onIgnored={() => {
            ignoredWarnings.push(this.state.openWarning);
            saveIgnoredWarnings();
            this._onDismiss(this.state.openWarning);
          }}
        />
      );
    }
    var warningRows = [];
    warningCounts.forEach((count, warning) => {
      warningRows.push(
        <WarningRow
          key={warning}
          onOpened={() => {
            this.setState({ openWarning: warning });
          }}
          onDismissed={this._onDismiss.bind(this, warning)}
          warning={warning}
        />
      );
    });
    return (
      <View style={styles.warningContainer}>
        {warningRows}
      </View>
    );
  },
});

var styles = StyleSheet.create({
  bold: {
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    height: 46,
    width: 46,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 32,
    position: 'relative',
    left: 8,
  },
  warningContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0
  },
  warningBox: {
    position: 'relative',
    backgroundColor: 'rgba(171, 124, 36, 0.9)',
    flex: 1,
    height: 46,
  },
  warningText: {
    color: 'white',
    position: 'absolute',
    left: 0,
    marginLeft: 15,
    marginRight: 46,
    top: 7,
  },
  yellowBox: {
    backgroundColor: 'rgba(171, 124, 36, 0.9)',
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    padding: 15,
    paddingTop: 35,
  },
  yellowBoxText: {
    color: 'white',
    fontSize: 20,
  },
  yellowBoxButtons: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 0,
  },
  yellowBoxButton: {
    flex: 1,
    padding: 25,
  },
  yellowBoxButtonText: {
    color: 'white',
    fontSize: 16,
  }
});

module.exports = WarningBox;
