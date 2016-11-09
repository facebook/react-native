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

/* eslint-disable dot-notation, no-dimensions-get-window */

'use strict';

var Dimensions = require('Dimensions');
var InspectorOverlay = require('InspectorOverlay');
var InspectorPanel = require('InspectorPanel');
var InspectorUtils = require('InspectorUtils');
var React = require('React');
var StyleSheet = require('StyleSheet');
var Touchable = require('Touchable');
var UIManager = require('UIManager');
var View = require('View');

if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  // required for devtools to be able to edit react native styles
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.resolveRNStyle = require('flattenStyle');
}

class Inspector extends React.Component {
  props: {
    inspectedViewTag: ?number,
    onRequestRerenderApp: (callback: (tag: ?number) => void) => void
  };

  state: {
    devtoolsAgent: ?Object,
    hierarchy: any,
    panelPos: string,
    inspecting: bool,
    selection: ?number,
    perfing: bool,
    inspected: any,
    inspectedViewTag: any,
    networking: bool,
  };

  _subs: ?Array<() => void>;

  constructor(props: Object) {
    super(props);

    this.state = {
      devtoolsAgent: null,
      hierarchy: null,
      panelPos: 'bottom',
      inspecting: true,
      perfing: false,
      inspected: null,
      selection: null,
      inspectedViewTag: this.props.inspectedViewTag,
      networking: false,
    };
  }

  componentDidMount() {
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      (this : any).attachToDevtools = this.attachToDevtools.bind(this);
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

  componentWillReceiveProps(newProps: Object) {
    this.setState({inspectedViewTag: newProps.inspectedViewTag});
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
    // if we inspect a stateless component we can't use the getPublicInstance method
    // therefore we use the internal _instance property directly.
    var publicInstance = instance['_instance'] || {};
    var source = instance['_currentElement'] && instance['_currentElement']['_source'];
    UIManager.measure(instance.getHostNode(), (x, y, width, height, left, top) => {
      this.setState({
        inspected: {
          frame: {left, top, width, height},
          style: publicInstance.props ? publicInstance.props.style : {},
          source,
        },
        selection: i,
      });
    });
  }

  onTouchInstance(touched: Object, frame: Object, pointerY: number) {
    // Most likely the touched instance is a native wrapper (like RCTView)
    // which is not very interesting. Most likely user wants a composite
    // instance that contains it (like View)
    var hierarchy = InspectorUtils.getOwnerHierarchy(touched);
    var instance = InspectorUtils.lastNotNativeInstance(hierarchy);

    if (this.state.devtoolsAgent) {
      this.state.devtoolsAgent.selectFromReactInstance(instance, true);
    }

    // if we inspect a stateless component we can't use the getPublicInstance method
    // therefore we use the internal _instance property directly.
    var publicInstance = instance['_instance'] || {};
    var props = publicInstance.props || {};
    var source = instance['_currentElement'] && instance['_currentElement']['_source'];
    this.setState({
      panelPos: pointerY > Dimensions.get('window').height / 2 ? 'top' : 'bottom',
      selection: hierarchy.indexOf(instance),
      hierarchy,
      inspected: {
        style: props.style || {},
        frame,
        source,
      },
    });
  }

  setPerfing(val: bool) {
    this.setState({
      perfing: val,
      inspecting: false,
      inspected: null,
      networking: false,
    });
  }

  setInspecting(val: bool) {
    this.setState({
      inspecting: val,
      inspected: null
    });
  }

  setTouchTargetting(val: bool) {
    Touchable.TOUCH_TARGET_DEBUG = val;
    this.props.onRequestRerenderApp((inspectedViewTag) => {
      this.setState({inspectedViewTag});
    });
  }

  setNetworking(val: bool) {
    this.setState({
      networking: val,
      perfing: false,
      inspecting: false,
      inspected: null,
    });
  }

  render() {
    var panelContainerStyle = (this.state.panelPos === 'bottom') ? {bottom: 0} : {top: 0};
    return (
      <View style={styles.container} pointerEvents="box-none">
        {this.state.inspecting &&
          <InspectorOverlay
            inspected={this.state.inspected}
            inspectedViewTag={this.state.inspectedViewTag}
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
            touchTargetting={Touchable.TOUCH_TARGET_DEBUG}
            setTouchTargetting={this.setTouchTargetting.bind(this)}
            networking={this.state.networking}
            setNetworking={this.setNetworking.bind(this)}
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
