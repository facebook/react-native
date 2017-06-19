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

const Dimensions = require('Dimensions');
const InspectorOverlay = require('InspectorOverlay');
const InspectorPanel = require('InspectorPanel');
const Platform = require('Platform');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');
const Touchable = require('Touchable');
const UIManager = require('UIManager');
const View = require('View');

const emptyObject = require('fbjs/lib/emptyObject');
const invariant = require('fbjs/lib/invariant');

export type ReactRenderer = {
  getInspectorDataForViewTag: (viewTag: number) => Object,
};

const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
const renderer: ReactRenderer = findRenderer();
// required for devtools to be able to edit react native styles
hook.resolveRNStyle = require('flattenStyle');

function findRenderer(): ReactRenderer {
  const renderers = hook._renderers;
  const keys = Object.keys(renderers);
  invariant(keys.length === 1, 'Expected to find exactly one React Native renderer on DevTools hook.');
  return renderers[keys[0]];
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
    hook.on('react-devtools', this.attachToDevtools);
    // if devtools is already started
    if (hook.reactDevtoolsAgent) {
      this.attachToDevtools(hook.reactDevtoolsAgent);
    }
  }

  componentWillUnmount() {
    if (this._subs) {
      this._subs.map(fn => fn());
    }
    hook.off('react-devtools', this.attachToDevtools);
  }

  componentWillReceiveProps(newProps: Object) {
    this.setState({inspectedViewTag: newProps.inspectedViewTag});
  }

  attachToDevtools = (agent: Object) => {
    let _hideWait = null;
    const hlSub = agent.sub('highlight', ({node, name, props}) => {
      clearTimeout(_hideWait);

      if (typeof node !== 'number') {
        // Fiber
        node = ReactNative.findNodeHandle(node);
      }

      UIManager.measure(node, (x, y, width, height, left, top) => {
        this.setState({
          hierarchy: [],
          inspected: {
            frame: {left, top, width, height},
            style: props ? props.style : emptyObject,
          },
        });
      });
    });
    const hideSub = agent.sub('hideHighlight', () => {
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
  };


  setSelection(i: number) {
    const hierarchyItem = this.state.hierarchy[i];
    // we pass in ReactNative.findNodeHandle as the method is injected
    const {
      measure,
      props,
      source,
    } = hierarchyItem.getInspectorData(ReactNative.findNodeHandle);

    measure((x, y, width, height, left, top) => {
      this.setState({
        inspected: {
          frame: {left, top, width, height},
          style: props.style,
          source,
        },
        selection: i,
      });
    });
  }

  onTouchViewTag(touchedViewTag: number, frame: Object, pointerY: number) {
    // Most likely the touched instance is a native wrapper (like RCTView)
    // which is not very interesting. Most likely user wants a composite
    // instance that contains it (like View)
    const {
      hierarchy,
      props,
      selection,
      source,
    } = renderer.getInspectorDataForViewTag(touchedViewTag);

    if (this.state.devtoolsAgent) {
      // Skip host leafs
      const offsetFromLeaf = hierarchy.length - 1 - selection;
      this.state.devtoolsAgent.selectFromDOMNode(touchedViewTag, true, offsetFromLeaf);
    }

    this.setState({
      panelPos: pointerY > Dimensions.get('window').height / 2 ? 'top' : 'bottom',
      selection,
      hierarchy,
      inspected: {
        style: props.style,
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
    const panelContainerStyle = (this.state.panelPos === 'bottom') ?
      {bottom: 0} :
      {top: Platform.OS === 'ios' ? 20 : 0};
    return (
      <View style={styles.container} pointerEvents="box-none">
        {this.state.inspecting &&
          <InspectorOverlay
            inspected={this.state.inspected}
            inspectedViewTag={this.state.inspectedViewTag}
            onTouchViewTag={this.onTouchViewTag.bind(this)}
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

const styles = StyleSheet.create({
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
