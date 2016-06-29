/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NavigationLegacyNavigatorRouteStack
 * @flow
 */
'use strict';

const invariant = require('fbjs/lib/invariant');

import type {
  NavigationState,
  NavigationParentState,
} from 'NavigationTypeDefinition';

type IterationCallback = (route: any, index: number, key: string) => void;

function isRouteEmpty(route: any): boolean {
  return (route === undefined || route === null || route === '') || false;
}

function areRouteNodesEqual(
  one: Array<RouteNode>,
  two: Array<RouteNode>,
): boolean {
  if (one === two) {
    return true;
  }

  if (one.length !== two.length) {
    return false;
  }
  for (let ii = 0, jj = one.length; ii < jj; ii++) {
    if (one[ii] !== two[ii]) {
      return false;
    }
  }
  return true;
}

let _nextRouteNodeID = 0;

/**
 * Private struct class that holds the key for a route.
 */
class RouteNode {
  key: string;
  route: any;

  /**
   * Cast `navigationState` as `RouteNode`.
   * Also see `RouteNode#toNavigationState`.
   */
  static fromNavigationState(navigationState: NavigationState): RouteNode {
    invariant(
      navigationState instanceof RouteNode,
      'navigationState should be an instacne of RouteNode'
    );
    return navigationState;
  }

  constructor(route: any) {
    // Key value gets bigger incrementally. Developer can compare the
    // keys of two routes then know which route is added to the stack
    // earlier.
    const key = String(_nextRouteNodeID++);
    if (__DEV__ ) {
      // Ensure the immutability of the node.
      Object.defineProperty(this, 'key' , {
        enumerable: true,
        configurable: false,
        writable: false,
        value: key,
      });
      Object.defineProperty(this, 'route' , {
        enumerable: true,
        configurable: false,
        writable: false,
        value: route,
      });
    } else {
      this.key = key;
      this.route = route;
    }
  }

  toNavigationState(): NavigationState {
    return this;
  }
}

let _nextRouteStackID = 0;

/**
 * The data structure that holds a list of routes and the focused index
 * of the routes. This data structure is implemented as immutable data
 * and mutation (e.g. push, pop...etc) will yields a new instance.
 */
class RouteStack {
  _index: number;
  _key: string;
  _routeNodes: Array<RouteNode>;

  static getRouteByNavigationState(navigationState: NavigationState): any {
    return RouteNode.fromNavigationState(navigationState).route;
  }

  constructor(index: number, routes: Array<any>) {
    invariant(
      routes.length > 0,
      'routes must not be an empty array'
    );

    invariant(
      index > -1 && index <= routes.length - 1,
      'RouteStack: index out of bound'
    );


    let routeNodes;
    if (routes[0] instanceof RouteNode) {
      // The array is already an array of <RouteNode>.
      routeNodes = routes;
    } else {
      // Wrap the route with <RouteNode>.
      routeNodes = routes.map((route) => {
        invariant(!isRouteEmpty(route), 'route must not be mepty');
        return new RouteNode(route);
      });
    }

    this._routeNodes = routeNodes;
    this._index = index;
    this._key = String(_nextRouteStackID++);
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get size(): number {
    return this._routeNodes.length;
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get index(): number {
    return this._index;
  }

  // Export as...
  toArray(): Array<any> {
    return this._routeNodes.map(node => node.route);
  }

  toNavigationState(): NavigationParentState {
    return {
      index: this._index,
      key: this._key,
      children: this._routeNodes.map(node => node.toNavigationState()),
    };
  }

  get(index: number): any {
    if (index < 0 || index > this._routeNodes.length - 1) {
      return null;
    }
    return this._routeNodes[index].route;
  }

  /**
   * Returns the key associated with the route.
   * When a route is added to a stack, the stack creates a key for this route.
   * The key will persist until the initial stack and its derived stack
   * no longer contains this route.
   */
  keyOf(route: any): ?string {
    if (isRouteEmpty(route)) {
      return null;
    }
    const index = this.indexOf(route);
    return index > -1 ?
      this._routeNodes[index].key :
      null;
  }

  indexOf(route: any): number {
    if (isRouteEmpty(route)) {
      return -1;
    }

    for (let ii = 0, jj = this._routeNodes.length; ii < jj; ii++) {
      const node = this._routeNodes[ii];
      if (node.route === route) {
        return ii;
      }
    }

    return -1;
  }

  slice(begin: ?number, end: ?number): RouteStack {
    // check `begin` and `end` first to keep @flow happy.
    const routeNodes = (end === undefined || end === null) ?
      this._routeNodes.slice(begin || 0) :
      this._routeNodes.slice(begin || 0, end || 0);

    const index = Math.min(this._index, routeNodes.length - 1);
    return this._update(index, routeNodes);
  }

  /**
   * Returns a new stack with the provided route appended,
   * starting at this stack size.
   */
  push(route: any): RouteStack {

    invariant(
      !isRouteEmpty(route),
      'Must supply route to push'
    );

    invariant(this.indexOf(route) === -1, 'route must be unique');

    // When pushing, removes the rest of the routes past the current index.
    const routeNodes = this._routeNodes.slice(0, this._index + 1);
    routeNodes.push(new RouteNode(route));
    return this._update(routeNodes.length - 1, routeNodes);
  }

  /**
   * Returns a new stack a size ones less than this stack,
   * excluding the last index in this stack.
   */
  pop(): RouteStack {
    if (this._routeNodes.length <= 1) {
      return this;
    }

    // When popping, removes the rest of the routes past the current index.
    const routeNodes = this._routeNodes.slice(0, this._index);
    return this._update(routeNodes.length - 1, routeNodes);
  }

  popToRoute(route: any): RouteStack {
    const index = this.indexOf(route);
    invariant(
      index > -1,
      'Calling popToRoute for a route that doesn\'t exist!'
    );
    return this.slice(0, index + 1);
  }

  jumpTo(route: any): RouteStack {
    const index = this.indexOf(route);
    return this.jumpToIndex(index);
  }

  jumpToIndex(index: number): RouteStack {
    invariant(
      index > -1 && index < this._routeNodes.length,
      'jumpToIndex: index out of bound'
    );

    return this._update(index, this._routeNodes);
  }

  jumpForward(): RouteStack {
    const index = this._index + 1;
    if (index >= this._routeNodes.length) {
      return this;
    }
    return this._update(index, this._routeNodes);
  }

  jumpBack(): RouteStack {
    const index = this._index - 1;
    if (index < 0) {
      return this;
    }
    return this._update(index, this._routeNodes);
  }

  /**
   * Replace a route in the navigation stack.
   *
   * `index` specifies the route in the stack that should be replaced.
   * If it's negative, it counts from the back.
   */
  replaceAtIndex(index: number, route: any): RouteStack {
    invariant(
      !isRouteEmpty(route),
      'Must supply route to replace'
    );

    if (this.get(index) === route) {
      return this;
    }

    invariant(this.indexOf(route) === -1, 'route must be unique');

    const size = this._routeNodes.length;
    if (index < 0) {
      index += size;
    }

    if (index < 0 || index >= size) {
      return this;
    }

    const routeNodes = this._routeNodes.slice(0);
    routeNodes[index] = new RouteNode(route);
    return this._update(index, routeNodes);
  }

  replacePreviousAndPop(route: any): RouteStack {
    if (this._index < 1) {
      // stack is too small.
      return this;
    }

    const index = this.indexOf(route);
    invariant(
      index === -1 || index === this._index - 1,
      'route already exists in the stack'
    );

    return this.replaceAtIndex(this._index - 1, route).popToRoute(route);
  }

  // Reset

  /**
   * Replace the current active route with a new route, and pops out
   * the rest routes after it.
   */
  resetTo(route: any): RouteStack {
    invariant(!isRouteEmpty(route), 'Must supply route');
    const index = this.indexOf(route);
    if (index === this._index) {
      // Already has this active route.
      return this;
    }
    invariant(index === -1, 'route already exists in the stack');
    const routeNodes = this._routeNodes.slice(0, this._index);
    routeNodes.push(new RouteNode(route));
    return this._update(routeNodes.length - 1, routeNodes);
  }

  resetRoutes(routes: Array<any>): RouteStack {
    const index = routes.length - 1;
    return new RouteStack(index, routes);
  }

  // Iterations
  forEach(callback: IterationCallback, context: ?Object): void {
    this._routeNodes.forEach((node, index) => {
      callback.call(context, node.route, index, node.key);
    });
  }

  mapToArray(callback: IterationCallback, context: ?Object): Array<any> {
    return this._routeNodes.map((node, index) => {
      return callback.call(context, node.route, index, node.key);
    });
  }

  _update(index: number, routeNodes: Array<RouteNode>): RouteStack {
    if (
      this._index === index &&
      areRouteNodesEqual(this._routeNodes, routeNodes)
    ) {
      return this;
    }

    return new RouteStack(index, routeNodes);
  }
}

module.exports = RouteStack;
