/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Dimensions = require('../Utilities/Dimensions');
const InspectorOverlay = require('./InspectorOverlay');
const InspectorPanel = require('./InspectorPanel');
const Platform = require('../Utilities/Platform');
const PressabilityDebug = require('../Pressability/PressabilityDebug');
const React = require('react');
const ReactNative = require('../Renderer/shims/ReactNative');
const StyleSheet = require('../StyleSheet/StyleSheet');
const View = require('../Components/View/View');
const ReactNativeStyleAttributes = require('../Components/View/ReactNativeStyleAttributes');

const invariant = require('invariant');

import type {
  HostComponent,
  TouchedViewDataAtPoint,
} from '../Renderer/shims/ReactNativeTypes';

type HostRef = React.ElementRef<HostComponent<mixed>>;

export type ReactRenderer = {
  rendererConfig: {
    getInspectorDataForViewAtPoint: (
      inspectedView: ?HostRef,
      locationX: number,
      locationY: number,
      callback: Function,
    ) => void,
    ...
  },
};

const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
const renderers = findRenderers();

// Required for React DevTools to view/edit React Native styles in Flipper.
// Flipper doesn't inject these values when initializing DevTools.
hook.resolveRNStyle = require('../StyleSheet/flattenStyle');
hook.nativeStyleEditorValidAttributes = Object.keys(ReactNativeStyleAttributes);

function findRenderers(): $ReadOnlyArray<ReactRenderer> {
  const allRenderers = Array.from(hook.renderers.values());
  invariant(
    allRenderers.length >= 1,
    'Expected to find at least one React Native renderer on DevTools hook.',
  );
  return allRenderers;
}

function getInspectorDataForViewAtPoint(
  inspectedView: ?HostRef,
  locationX: number,
  locationY: number,
  callback: (viewData: TouchedViewDataAtPoint) => void,
) {
  // Check all renderers for inspector data.
  for (let i = 0; i < renderers.length; i++) {
    const renderer = renderers[i];
    if (renderer?.rendererConfig?.getInspectorDataForViewAtPoint != null) {
      renderer.rendererConfig.getInspectorDataForViewAtPoint(
        inspectedView,
        locationX,
        locationY,
        viewData => {
          // Only return with non-empty view data since only one renderer will have this view.
          if (viewData && viewData.hierarchy.length > 0) {
            callback(viewData);
          }
        },
      );
    }
  }
}

class Inspector extends React.Component<
  {
    inspectedView: ?HostRef,
    onRequestRerenderApp: (callback: (instance: ?HostRef) => void) => void,
    ...
  },
  {
    devtoolsAgent: ?Object,
    hierarchy: any,
    panelPos: string,
    inspecting: boolean,
    selection: ?number,
    perfing: boolean,
    inspected: any,
    inspectedView: ?HostRef,
    networking: boolean,
    ...
  },
> {
  _hideTimeoutID: TimeoutID | null = null;
  _subs: ?Array<() => void>;
  _setTouchedViewData: ?(TouchedViewDataAtPoint) => void;

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
      inspectedView: this.props.inspectedView,
      networking: false,
    };
  }

  componentDidMount() {
    hook.on('react-devtools', this._attachToDevtools);
    // if devtools is already started
    if (hook.reactDevtoolsAgent) {
      this._attachToDevtools(hook.reactDevtoolsAgent);
    }
  }

  componentWillUnmount() {
    if (this._subs) {
      this._subs.map(fn => fn());
    }
    hook.off('react-devtools', this._attachToDevtools);
    this._setTouchedViewData = null;
  }

  UNSAFE_componentWillReceiveProps(newProps: Object) {
    this.setState({inspectedView: newProps.inspectedView});
  }

  _attachToDevtools = (agent: Object) => {
    agent.addListener('hideNativeHighlight', this._onAgentHideNativeHighlight);
    agent.addListener('showNativeHighlight', this._onAgentShowNativeHighlight);
    agent.addListener('shutdown', this._onAgentShutdown);

    this.setState({
      devtoolsAgent: agent,
    });
  };

  _onAgentHideNativeHighlight = () => {
    if (this.state.inspected === null) {
      return;
    }
    // we wait to actually hide in order to avoid flicker
    this._hideTimeoutID = setTimeout(() => {
      this.setState({
        inspected: null,
      });
    }, 100);
  };

  _onAgentShowNativeHighlight = (node: any) => {
    clearTimeout(this._hideTimeoutID);

    // Shape of `node` is different in Fabric.
    const component = node.canonical ?? node;

    component.measure((x, y, width, height, left, top) => {
      this.setState({
        hierarchy: [],
        inspected: {
          frame: {left, top, width, height},
        },
      });
    });
  };

  _onAgentShutdown = () => {
    const agent = this.state.devtoolsAgent;
    if (agent != null) {
      agent.removeListener(
        'hideNativeHighlight',
        this._onAgentHideNativeHighlight,
      );
      agent.removeListener(
        'showNativeHighlight',
        this._onAgentShowNativeHighlight,
      );
      agent.removeListener('shutdown', this._onAgentShutdown);

      this.setState({devtoolsAgent: null});
    }
  };

  setSelection(i: number) {
    const hierarchyItem = this.state.hierarchy[i];
    // we pass in ReactNative.findNodeHandle as the method is injected
    const {measure, props, source} = hierarchyItem.getInspectorData(
      ReactNative.findNodeHandle,
    );

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

  onTouchPoint(locationX: number, locationY: number) {
    this._setTouchedViewData = viewData => {
      const {
        hierarchy,
        props,
        selectedIndex,
        source,
        frame,
        pointerY,
        touchedViewTag,
      } = viewData;

      // Sync the touched view with React DevTools.
      // Note: This is Paper only. To support Fabric,
      // DevTools needs to be updated to not rely on view tags.
      if (this.state.devtoolsAgent && touchedViewTag) {
        this.state.devtoolsAgent.selectNode(
          ReactNative.findNodeHandle(touchedViewTag),
        );
      }

      this.setState({
        panelPos:
          pointerY > Dimensions.get('window').height / 2 ? 'top' : 'bottom',
        selection: selectedIndex,
        hierarchy,
        inspected: {
          style: props.style,
          frame,
          source,
        },
      });
    };
    getInspectorDataForViewAtPoint(
      this.state.inspectedView,
      locationX,
      locationY,
      viewData => {
        if (this._setTouchedViewData != null) {
          this._setTouchedViewData(viewData);
          this._setTouchedViewData = null;
        }
      },
    );
  }

  setPerfing(val: boolean) {
    this.setState({
      perfing: val,
      inspecting: false,
      inspected: null,
      networking: false,
    });
  }

  setInspecting(val: boolean) {
    this.setState({
      inspecting: val,
      inspected: null,
    });
  }

  setTouchTargeting(val: boolean) {
    PressabilityDebug.setEnabled(val);
    this.props.onRequestRerenderApp(inspectedView => {
      this.setState({inspectedView});
    });
  }

  setNetworking(val: boolean) {
    this.setState({
      networking: val,
      perfing: false,
      inspecting: false,
      inspected: null,
    });
  }

  render(): React.Node {
    const panelContainerStyle =
      this.state.panelPos === 'bottom'
        ? {bottom: 0}
        : {top: Platform.OS === 'ios' ? 20 : 0};
    return (
      <View style={styles.container} pointerEvents="box-none">
        {this.state.inspecting && (
          <InspectorOverlay
            inspected={this.state.inspected}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            onTouchPoint={this.onTouchPoint.bind(this)}
          />
        )}
        <View style={[styles.panelContainer, panelContainerStyle]}>
          <InspectorPanel
            devtoolsIsOpen={!!this.state.devtoolsAgent}
            inspecting={this.state.inspecting}
            perfing={this.state.perfing}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            setPerfing={this.setPerfing.bind(this)}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            setInspecting={this.setInspecting.bind(this)}
            inspected={this.state.inspected}
            hierarchy={this.state.hierarchy}
            selection={this.state.selection}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            setSelection={this.setSelection.bind(this)}
            touchTargeting={PressabilityDebug.isEnabled()}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
            setTouchTargeting={this.setTouchTargeting.bind(this)}
            networking={this.state.networking}
            // $FlowFixMe[method-unbinding] added when improving typing for this parameters
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
