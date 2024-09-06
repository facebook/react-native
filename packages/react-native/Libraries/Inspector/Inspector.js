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

import type {InspectedViewRef} from '../ReactNative/AppContainer-dev';
import type {
  InspectorData,
  TouchedViewDataAtPoint,
} from '../Renderer/shims/ReactNativeTypes';
import type {ViewStyleProp} from '../StyleSheet/StyleSheet';
import type {ReactDevToolsAgent} from '../Types/ReactDevToolsTypes';
import SafeAreaView from '../../src/private/components/SafeAreaView_INTERNAL_DO_NOT_USE';

const View = require('../Components/View/View');
const PressabilityDebug = require('../Pressability/PressabilityDebug');
const {findNodeHandle} = require('../ReactNative/RendererProxy');
const StyleSheet = require('../StyleSheet/StyleSheet');
const Dimensions = require('../Utilities/Dimensions').default;
const Platform = require('../Utilities/Platform');
const getInspectorDataForViewAtPoint = require('./getInspectorDataForViewAtPoint');
const InspectorOverlay = require('./InspectorOverlay');
const InspectorPanel = require('./InspectorPanel');
const React = require('react');

const {useState} = React;

type PanelPosition = 'top' | 'bottom';
type SelectedTab =
  | 'elements-inspector'
  | 'network-profiling'
  | 'performance-profiling';

export type InspectedElementFrame = TouchedViewDataAtPoint['frame'];
export type InspectedElement = $ReadOnly<{
  frame: InspectedElementFrame,
  style?: ViewStyleProp,
}>;
export type ElementsHierarchy = InspectorData['hierarchy'];

type Props = {
  inspectedViewRef: InspectedViewRef,
  onRequestRerenderApp: () => void,
  reactDevToolsAgent?: ReactDevToolsAgent,
};

function Inspector({
  inspectedViewRef,
  onRequestRerenderApp,
  reactDevToolsAgent,
}: Props): React.Node {
  const [selectedTab, setSelectedTab] =
    useState<?SelectedTab>('elements-inspector');

  const [panelPosition, setPanelPosition] = useState<PanelPosition>('bottom');
  const [inspectedElement, setInspectedElement] =
    useState<?InspectedElement>(null);
  const [selectionIndex, setSelectionIndex] = useState<?number>(null);
  const [elementsHierarchy, setElementsHierarchy] =
    useState<?ElementsHierarchy>(null);

  const setSelection = (i: number) => {
    const hierarchyItem = elementsHierarchy?.[i];
    if (hierarchyItem == null) {
      return;
    }

    // We pass in findNodeHandle as the method is injected
    const {measure, props} = hierarchyItem.getInspectorData(findNodeHandle);

    measure((x, y, width, height, left, top) => {
      // $FlowFixMe[incompatible-call] `props` from InspectorData are defined as <string, string> dictionary, which is incompatible with ViewStyleProp
      setInspectedElement({
        frame: {left, top, width, height},
        style: props.style,
      });

      setSelectionIndex(i);
    });
  };

  const onTouchPoint = (locationX: number, locationY: number) => {
    const setTouchedViewData = (viewData: TouchedViewDataAtPoint) => {
      const {
        hierarchy,
        props,
        selectedIndex,
        frame,
        pointerY,
        touchedViewTag,
        closestInstance,
      } = viewData;

      // Sync the touched view with React DevTools.
      // Note: This is Paper only. To support Fabric,
      // DevTools needs to be updated to not rely on view tags.
      if (reactDevToolsAgent) {
        reactDevToolsAgent.selectNode(findNodeHandle(touchedViewTag));
        if (closestInstance != null) {
          reactDevToolsAgent.selectNode(closestInstance);
        }
      }

      setPanelPosition(
        pointerY > Dimensions.get('window').height / 2 ? 'top' : 'bottom',
      );
      setSelectionIndex(selectedIndex);
      setElementsHierarchy(hierarchy);
      // $FlowFixMe[incompatible-call] `props` from InspectorData are defined as <string, string> dictionary, which is incompatible with ViewStyleProp
      setInspectedElement({
        frame,
        style: props.style,
      });
    };

    getInspectorDataForViewAtPoint(
      inspectedViewRef.current,
      locationX,
      locationY,
      viewData => {
        setTouchedViewData(viewData);
        return false;
      },
    );
  };

  const setInspecting = (enabled: boolean) => {
    setSelectedTab(enabled ? 'elements-inspector' : null);
    setInspectedElement(null);
  };

  const setPerfing = (enabled: boolean) => {
    setSelectedTab(enabled ? 'performance-profiling' : null);
    setInspectedElement(null);
  };

  const setNetworking = (enabled: boolean) => {
    setSelectedTab(enabled ? 'network-profiling' : null);
    setInspectedElement(null);
  };

  const setTouchTargeting = (val: boolean) => {
    PressabilityDebug.setEnabled(val);
    onRequestRerenderApp();
  };

  const panelContainerStyle =
    panelPosition === 'bottom'
      ? {bottom: 0}
      : Platform.select({ios: {top: 0}, default: {top: 0}});

  return (
    <View style={styles.container} pointerEvents="box-none">
      {selectedTab === 'elements-inspector' && (
        <InspectorOverlay
          inspected={inspectedElement}
          onTouchPoint={onTouchPoint}
        />
      )}

      <SafeAreaView style={[styles.panelContainer, panelContainerStyle]}>
        <InspectorPanel
          devtoolsIsOpen={!!reactDevToolsAgent}
          inspecting={selectedTab === 'elements-inspector'}
          perfing={selectedTab === 'performance-profiling'}
          setPerfing={setPerfing}
          setInspecting={setInspecting}
          inspected={inspectedElement}
          hierarchy={elementsHierarchy}
          selection={selectionIndex}
          setSelection={setSelection}
          touchTargeting={PressabilityDebug.isEnabled()}
          setTouchTargeting={setTouchTargeting}
          networking={selectedTab === 'network-profiling'}
          setNetworking={setNetworking}
        />
      </SafeAreaView>
    </View>
  );
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
