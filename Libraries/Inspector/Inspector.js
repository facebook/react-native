/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Inspector
 * @flow
 */
'use strict';

var Dimensions = require('Dimensions');
var InspectorOverlay = require('InspectorOverlay');
var InspectorPanel = require('InspectorPanel');
var InspectorUtils = require('InspectorUtils');
var React = require('React');
var StyleSheet = require('StyleSheet');
var UIManager = require('NativeModules').UIManager;
var View = require('View');

if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  // required for devtools to be able to edit react native styles
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.resolveRNStyle = require('flattenStyle');
}

class Inspector extends React.Component {
  _subs: ?Array<() => void>;

  constructor(props: Object) {
    super(props);

    this.state = {
      devtoolsAgent: null,
      panelPos: 'bottom',
      inspecting: true,
      perfing: false,
      inspected: null,
    };
  }

  componentDidMount() {
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      this.attachToDevtools = this.attachToDevtools.bind(this);
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.on('react-devtools', this.attachToDevtools);
      // if devtools is already started
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent) {
        this.attachToDevtools(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent);
      }
    }
  }

  componentWillUnmount() {
    if (this._subs) {
      this._subs.map(fn => fn());
    }
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.off('react-devtools', this.attachToDevtools);
    }
  }

  attachToDevtools(agent: Object) {
    var _hideWait = null;
    var hlSub = agent.sub('highlight', ({node, name, props}) => {
      clearTimeout(_hideWait);
      UIManager.measure(node, (x, y, width, height, left, top) => {
        this.setState({
          hierarchy: [],
          inspected: {
            frame: {left, top, width, height},
            style: props ? props.style : {},
          },
        });
      });
    });
    var hideSub = agent.sub('hideHighlight', () => {
      if (this.state.inspected === null) {
        return;
      }
      // we wait to actually hide in order to avoid flicker
      _hideWait = setTimeout(() => {
        this.setState({
          inspected: null,
        });
      }, 100);
    });
    this._subs = [hlSub, hideSub];

    agent.on('shutdown', () => {
      this.setState({devtoolsAgent: null});
      this._subs = null;
    });
    this.setState({
      devtoolsAgent: agent,
    });
  }

  setSelection(i: number) {
    var instance = this.state.hierarchy[i];
    var publicInstance = instance.getPublicInstance();
    UIManager.measure(React.findNodeHandle(instance), (x, y, width, height, left, top) => {
      this.setState({
        inspected: {
          frame: {left, top, width, height},
          style: publicInstance.props ? publicInstance.props.style : {},
        },
        selection: i,
      });
    });
  }

  onTouchInstance(instance: Object, frame: Object, pointerY: number) {
    if (this.state.devtoolsAgent) {
      this.state.devtoolsAgent.selectFromReactInstance(instance, true);
    }
    var hierarchy = InspectorUtils.getOwnerHierarchy(instance);
    var publicInstance = instance.getPublicInstance();
    var props = publicInstance.props || {};
    this.setState({
      panelPos: pointerY > Dimensions.get('window').height / 2 ? 'top' : 'bottom',
      selection: hierarchy.length - 1,
      hierarchy,
      inspected: {
        style: props.style || {},
        frame,
      },
    });
  }

  setPerfing(val: bool) {
    this.setState({
      perfing: val,
      inspecting: false,
      inspected: null,
    });
  }

  setInspecting(val: bool) {
    this.setState({
      inspecting: val,
      inspected: null
    });
  }

  render() {
    var panelContainerStyle = (this.state.panelPos === 'bottom') ? {bottom: 0} : {top: 0};
    return (
      <View style={styles.container} pointerEvents="box-none">
        {this.state.inspecting &&
          <InspectorOverlay
            rootTag={this.props.rootTag}
            inspected={this.state.inspected}
            inspectedViewTag={this.props.inspectedViewTag}
            onTouchInstance={this.onTouchInstance.bind(this)}
          />}
        <View style={[styles.panelContainer, panelContainerStyle]}>
          <InspectorPanel
            devtoolsIsOpen={!!this.state.devtoolsAgent}
            inspecting={this.state.inspecting}
            perfing={this.state.perfing}
            setPerfing={this.setPerfing.bind(this)}
            setInspecting={this.setInspecting.bind(this)}
            inspected={this.state.inspected}
            hierarchy={this.state.hierarchy}
            selection={this.state.selection}
            setSelection={this.setSelection.bind(this)}
          />
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panelContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

module.exports = Inspector;
