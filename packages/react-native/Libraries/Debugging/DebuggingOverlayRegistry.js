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

import {findNodeHandle} from '../ReactNative/RendererProxy';
import processColor from '../StyleSheet/processColor';

// TODO(T171193075): __REACT_DEVTOOLS_GLOBAL_HOOK__ is always injected in dev-bundles,
// but it is not mocked in some Jest tests. We should update Jest tests setup, so it would be the same as expected testing environment.
const reactDevToolsHook: ?ReactDevToolsGlobalHook =
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

export type DebuggingOverlayRegistrySubscriberProtocol = {
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

class DebuggingOverlayRegistry {
  #registry: Set<DebuggingOverlayRegistrySubscriberProtocol> = new Set();
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

  subscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    this.#registry.add(subscriber);
  }

  unsubscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol) {
    const wasPresent = this.#registry.delete(subscriber);
    if (!wasPresent) {
      console.error(
        '[DebuggingOverlayRegistry] Unexpected argument for unsubscription, which was not previously subscribed:',
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
  ): ?DebuggingOverlayRegistrySubscriberProtocol {
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
      DebuggingOverlayRegistrySubscriberProtocol,
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

      // DebuggingOverlay will scale to the same size as a Root view. Substract Root view position from the element position
      // to calculate the element's position relatively to its parent DebuggingOverlay.
      // We can't call `getBoundingClientRect` on the debuggingOverlayRef, because its a ref for the native component, which doesn't have it, hopefully yet.
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
    const promisesToResolve: Array<Promise<TraceUpdate>> = [];

    for (const {id, instance, color} of updates) {
      const frameToDrawPromise = new Promise<TraceUpdate>((resolve, reject) => {
        instance.measure((x, y, width, height, left, top) => {
          // measure can execute callback without any values provided to signal error.
          if (left == null || top == null || width == null || height == null) {
            reject('Unexpectedly failed to call measure on an instance.');
          }

          resolve({
            id,
            rectangle: {x: left, y: top, width, height},
            color: processColor(color),
          });
        });
      });

      promisesToResolve.push(frameToDrawPromise);
    }

    Promise.all(promisesToResolve)
      .then(resolvedTraceUpdates => {
        for (const {rootViewRef, debuggingOverlayRef} of this.#registry) {
          const rootViewReactTag = findNodeHandle(rootViewRef.current);
          if (rootViewReactTag == null) {
            continue;
          }

          debuggingOverlayRef.current?.highlightTraceUpdates(
            resolvedTraceUpdates,
          );
        }
      })
      .catch(() => {
        // noop. For legacy architecture (Paper) this can happen for root views or LogBox button.
        // LogBox case: it has a separate React root, so `measure` fails.
        // Calling `console.error` here would trigger rendering a new LogBox button, for which we will call measure again, this is a cycle.
        // Don't spam the UI with errors for such cases.
      });
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

      // DebuggingOverlay will scale to the same size as a Root view. Substract Root view position from the element position
      // to calculate the element's position relatively to its parent DebuggingOverlay.
      // We can't call `getBoundingClientRect` on the debuggingOverlayRef, because its a ref for the native component, which doesn't have it, hopefully yet.
      parent.debuggingOverlayRef.current?.highlightElements([
        {x: x - parentX, y: y - parentY, width, height},
      ]);
    }
  }

  // TODO: remove once DOM Node APIs are opt-in by default and Paper is no longer supported.
  #onHighlightElementsLegacy(publicInstance: NativeMethods): void {
    publicInstance.measure((x, y, width, height, left, top) => {
      // measure can execute callback without any values provided to signal error.
      if (left == null || top == null || width == null || height == null) {
        return;
      }

      for (const {debuggingOverlayRef} of this.#registry) {
        debuggingOverlayRef.current?.highlightElements([
          {x: left, y: top, width, height},
        ]);
      }
    });
  }

  #onClearElementsHighlights: (
    ...ReactDevToolsAgentEvents['hideNativeHighlight']
  ) => void = () => {
    for (const subscriber of this.#registry) {
      subscriber.debuggingOverlayRef.current?.clearElementsHighlight();
    }
  };
}

const debuggingOverlayRegistryInstance: DebuggingOverlayRegistry =
  new DebuggingOverlayRegistry();
export default debuggingOverlayRegistryInstance;
