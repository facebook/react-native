/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import type ReactNativeElement from '../DOM/Nodes/ReactNativeElement';
import type ReadOnlyElement from '../DOM/Nodes/ReadOnlyElement';
import type {
  AppContainerRootViewRef,
  DebuggingOverlayRef,
} from '../ReactNative/AppContainer-dev';
import type {NativeMethods} from '../Renderer/shims/ReactNativeTypes';
import type {
  InstanceFromReactDevTools,
  ReactDevToolsAgent,
  ReactDevToolsAgentEvents,
  ReactDevToolsGlobalHook,
} from '../Types/ReactDevToolsTypes';
import type {TraceUpdate} from './DebuggingOverlayNativeComponent';

import {
  findNodeHandle,
  isChildPublicInstance,
} from '../ReactNative/RendererProxy';
import processColor from '../StyleSheet/processColor';

// TODO(T171193075): __REACT_DEVTOOLS_GLOBAL_HOOK__ is always injected in dev-bundles,
// but it is not mocked in some Jest tests. We should update Jest tests setup, so it would be the same as expected testing environment.
const reactDevToolsHook: ?ReactDevToolsGlobalHook =
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

export type DebuggingRegistrySubscriberProtocol = {
  rootViewRef: AppContainerRootViewRef,
  debuggingOverlayRef: DebuggingOverlayRef,
};

type ModernNodeUpdate = {
  id: number,
  instance: ReactNativeElement,
  color: string,
};

type LegacyNodeUpdate = {
  id: number,
  instance: NativeMethods,
  color: string,
};

class DebuggingRegistry {
  #registry: Set<DebuggingRegistrySubscriberProtocol> = new Set();
  #reactDevToolsAgent: ReactDevToolsAgent | null = null;

  constructor() {
    if (reactDevToolsHook?.reactDevtoolsAgent != null) {
      this.#onReactDevToolsAgentAttached(reactDevToolsHook.reactDevtoolsAgent);
      return;
    }

    reactDevToolsHook?.on?.(
      'react-devtools',
      this.#onReactDevToolsAgentAttached,
    );
  }

  subscribe(subscriber: DebuggingRegistrySubscriberProtocol) {
    this.#registry.add(subscriber);
  }

  unsubscribe(subscriber: DebuggingRegistrySubscriberProtocol) {
    const wasPresent = this.#registry.delete(subscriber);
    if (!wasPresent) {
      console.error(
        '[DebuggingRegistry] Unexpected argument for unsubscription, which was not previously subscribed:',
        subscriber,
      );
    }
  }

  #onReactDevToolsAgentAttached = (agent: ReactDevToolsAgent): void => {
    this.#reactDevToolsAgent = agent;

    agent.addListener('drawTraceUpdates', this.#onDrawTraceUpdates);
    agent.addListener('showNativeHighlight', this.#onHighlightElements);
    agent.addListener('hideNativeHighlight', this.#onClearElementsHighlights);
  };

  #getPublicInstanceFromInstance(
    instanceHandle: InstanceFromReactDevTools,
  ): NativeMethods | null {
    // `canonical.publicInstance` => Fabric
    if (instanceHandle.canonical?.publicInstance != null) {
      return instanceHandle.canonical?.publicInstance;
    }

    // `canonical` => Legacy Fabric
    if (instanceHandle.canonical != null) {
      // $FlowFixMe[incompatible-return]
      return instanceHandle.canonical;
    }

    // `instanceHandle` => Legacy renderer
    if (instanceHandle.measure != null) {
      // $FlowFixMe[incompatible-return]
      return instanceHandle;
    }

    return null;
  }

  #findLowestParentFromRegistryForInstance(
    instance: ReactNativeElement,
  ): ?DebuggingRegistrySubscriberProtocol {
    let iterator: ?ReadOnlyElement = instance;
    while (iterator != null) {
      for (const subscriber of this.#registry) {
        if (subscriber.rootViewRef.current === iterator) {
          return subscriber;
        }
      }

      iterator = iterator.parentElement;
    }

    return null;
  }

  #findLowestParentFromRegistryForInstanceLegacy(
    instance: NativeMethods,
  ): ?DebuggingRegistrySubscriberProtocol {
    const candidates: Array<DebuggingRegistrySubscriberProtocol> = [];

    for (const subscriber of this.#registry) {
      if (
        subscriber.rootViewRef.current != null &&
        // $FlowFixMe[incompatible-call] There is a lot of stuff to untangle to make types for refs work.
        isChildPublicInstance(subscriber.rootViewRef.current, instance)
      ) {
        candidates.push(subscriber);
      }
    }

    if (candidates.length === 0) {
      // In some cases, like with LogBox in AR, the whole subtree for specific React root might not have an AppContainer.
      return null;
    }

    if (candidates.length === 1) {
      return candidates[0];
    }

    // If there are multiple candidates, we need to find the lowest.
    // Imagine the case when there is a modal on the screen, both of them will have their own AppContainers,
    // but modal's AppContainer is a child of screen's AppContainer.
    const candidatesWithNoChildren: Array<DebuggingRegistrySubscriberProtocol> =
      [];
    for (const potentialParent of candidates) {
      let shouldSkipThisParent = false;

      for (const potentialChild of candidates) {
        if (potentialChild === potentialParent) {
          continue;
        }

        if (potentialChild.rootViewRef.current == null) {
          continue;
        }

        if (potentialParent.rootViewRef.current == null) {
          shouldSkipThisParent = true;
          break;
        }

        if (
          isChildPublicInstance(
            // $FlowFixMe[incompatible-call] There is a lot of stuff to untangle to make types for refs work.
            potentialParent.rootViewRef.current,
            // $FlowFixMe[incompatible-call] There is a lot of stuff to untangle to make types for refs work.
            potentialChild.rootViewRef.current,
          )
        ) {
          shouldSkipThisParent = true;
          break;
        }
      }

      if (!shouldSkipThisParent) {
        candidatesWithNoChildren.push(potentialParent);
      }
    }

    if (candidatesWithNoChildren.length === 0) {
      console.error(
        '[DebuggingRegistry] Unexpected circular relationship between AppContainers',
      );
      return null;
    }

    if (candidatesWithNoChildren.length === 1) {
      return candidatesWithNoChildren[0];
    }

    console.error(
      '[DebuggingRegistry] Unexpected multiple options for lowest parent AppContainer',
    );
    return null;
  }

  #onDrawTraceUpdates: (
    ...ReactDevToolsAgentEvents['drawTraceUpdates']
  ) => void = traceUpdates => {
    const modernNodesUpdates: Array<ModernNodeUpdate> = [];
    const legacyNodesUpdates: Array<LegacyNodeUpdate> = [];

    for (const {node, color} of traceUpdates) {
      const publicInstance = this.#getPublicInstanceFromInstance(node);
      if (publicInstance == null) {
        return;
      }

      const instanceReactTag = findNodeHandle(node);
      if (instanceReactTag == null) {
        return;
      }

      // Lazy import to avoid dependency cycle.
      const ReactNativeElementClass =
        require('../DOM/Nodes/ReactNativeElement').default;
      if (publicInstance instanceof ReactNativeElementClass) {
        modernNodesUpdates.push({
          id: instanceReactTag,
          instance: publicInstance,
          color,
        });
      } else {
        legacyNodesUpdates.push({
          id: instanceReactTag,
          instance: publicInstance,
          color,
        });
      }
    }

    if (modernNodesUpdates.length > 0) {
      this.#drawTraceUpdatesModern(modernNodesUpdates);
    }

    if (legacyNodesUpdates.length > 0) {
      this.#drawTraceUpdatesLegacy(legacyNodesUpdates);
    }
  };

  #drawTraceUpdatesModern(updates: Array<ModernNodeUpdate>): void {
    const parentToTraceUpdatesMap = new Map<
      DebuggingRegistrySubscriberProtocol,
      Array<TraceUpdate>,
    >();
    for (const {id, instance, color} of updates) {
      const parent = this.#findLowestParentFromRegistryForInstance(instance);
      if (parent == null) {
        continue;
      }

      let traceUpdatesForParent = parentToTraceUpdatesMap.get(parent);
      if (traceUpdatesForParent == null) {
        traceUpdatesForParent = [];
        parentToTraceUpdatesMap.set(parent, traceUpdatesForParent);
      }

      const {x, y, width, height} = instance.getBoundingClientRect();

      const rootViewInstance = parent.rootViewRef.current;
      if (rootViewInstance == null) {
        continue;
      }

      const {x: parentX, y: parentY} =
        // $FlowFixMe[prop-missing] React Native View is not a descendant of ReactNativeElement yet. We should be able to remove it once Paper is no longer supported.
        rootViewInstance.getBoundingClientRect();

      traceUpdatesForParent.push({
        id,
        rectangle: {x: x - parentX, y: y - parentY, width, height},
        color: processColor(color),
      });
    }

    for (const [parent, traceUpdates] of parentToTraceUpdatesMap.entries()) {
      const {debuggingOverlayRef} = parent;
      debuggingOverlayRef.current?.highlightTraceUpdates(traceUpdates);
    }
  }

  // TODO: remove once DOM Node APIs are opt-in by default and Paper is no longer supported.
  #drawTraceUpdatesLegacy(updates: Array<LegacyNodeUpdate>): void {
    const parentToTraceUpdatesPromisesMap = new Map<
      DebuggingRegistrySubscriberProtocol,
      Array<Promise<TraceUpdate>>,
    >();

    for (const {id, instance, color} of updates) {
      const parent =
        this.#findLowestParentFromRegistryForInstanceLegacy(instance);

      if (parent == null) {
        continue;
      }

      let traceUpdatesPromisesForParent =
        parentToTraceUpdatesPromisesMap.get(parent);
      if (traceUpdatesPromisesForParent == null) {
        traceUpdatesPromisesForParent = [];
        parentToTraceUpdatesPromisesMap.set(
          parent,
          traceUpdatesPromisesForParent,
        );
      }

      const frameToDrawPromise = new Promise<TraceUpdate>(resolve => {
        instance.measure((x, y, width, height, left, top) => {
          resolve({
            id,
            rectangle: {x: left, y: top, width, height},
            color: processColor(color),
          });
        });
      });

      traceUpdatesPromisesForParent.push(frameToDrawPromise);
    }

    for (const [
      parent,
      traceUpdatesPromises,
    ] of parentToTraceUpdatesPromisesMap.entries()) {
      Promise.all(traceUpdatesPromises).then(
        resolvedTraceUpdates =>
          parent.debuggingOverlayRef.current?.highlightTraceUpdates(
            resolvedTraceUpdates,
          ),
        err => {
          console.error(`Failed to measure updated traces. Error: ${err}`);
        },
      );
    }
  }

  #onHighlightElements: (
    ...ReactDevToolsAgentEvents['showNativeHighlight']
  ) => void = node => {
    // First clear highlights for every container
    for (const subscriber of this.#registry) {
      subscriber.debuggingOverlayRef.current?.clearElementsHighlight();
    }

    const publicInstance = this.#getPublicInstanceFromInstance(node);
    if (publicInstance == null) {
      return;
    }

    // Lazy import to avoid dependency cycle.
    const ReactNativeElementClass =
      require('../DOM/Nodes/ReactNativeElement').default;
    if (publicInstance instanceof ReactNativeElementClass) {
      this.#onHighlightElementsModern(publicInstance);
    } else {
      this.#onHighlightElementsLegacy(publicInstance);
    }
  };

  #onHighlightElementsModern(publicInstance: ReactNativeElement): void {
    const {x, y, width, height} = publicInstance.getBoundingClientRect();

    const parent =
      this.#findLowestParentFromRegistryForInstance(publicInstance);

    if (parent) {
      const rootViewInstance = parent.rootViewRef.current;
      if (rootViewInstance == null) {
        return;
      }

      const {x: parentX, y: parentY} =
        // $FlowFixMe[prop-missing] React Native View is not a descendant of ReactNativeElement yet. We should be able to remove it once Paper is no longer supported.
        rootViewInstance.getBoundingClientRect();

      parent.debuggingOverlayRef.current?.highlightElements([
        {x: x - parentX, y: y - parentY, width, height},
      ]);
    }
  }

  // TODO: remove once DOM Node APIs are opt-in by default and Paper is no longer supported.
  #onHighlightElementsLegacy(publicInstance: NativeMethods): void {
    const container =
      this.#findLowestParentFromRegistryForInstanceLegacy(publicInstance);

    if (container != null) {
      publicInstance.measure((x, y, width, height, left, top) => {
        container.debuggingOverlayRef.current?.highlightElements([
          {x: left, y: top, width, height},
        ]);
      });
    }
  }

  #onClearElementsHighlights: (
    ...ReactDevToolsAgentEvents['hideNativeHighlight']
  ) => void = () => {
    for (const subscriber of this.#registry) {
      subscriber.debuggingOverlayRef.current?.clearElementsHighlight();
    }
  };
}

const debuggingRegistryInstance: DebuggingRegistry = new DebuggingRegistry();
export default debuggingRegistryInstance;
