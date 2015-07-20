/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NavigationRouteStack
 */
'use strict';

var immutable = require('immutable');
var invariant = require('invariant');

var {List} = immutable;

/**
 * The immutable routes stack.
 */
class RouteStack {
  _index: number;

  _routes: List;

  constructor(index: number, routes: List) {
    invariant(
      routes.size > 0,
      'size must not be empty'
    );

    invariant(
      index > -1 && index <= routes.size - 1,
      'index out of bound'
    );

    this._routes = routes;
    this._index = index;
  }

  get size(): number {
    return this._routes.size;
  }

  get index(): number {
    return this._index;
  }

  toArray(): Array {
    return this._routes.toJS();
  }

  get(index: number): any {
    if (index < 0 || index > this._routes.size - 1) {
      return null;
    }
    return this._routes.get(index);
  }

  /**
   * Returns a new stack with the provided route appended,
   * starting at this stack size.
   */
  push(route: any): RouteStack {
    invariant(
      route === 0 ||
      route === false ||
      !!route,
      'Must supply route to push'
    );

    invariant(this._routes.indexOf(route) === -1, 'route must be unique');

    // When pushing, removes the rest of the routes past the current index.
    var routes = this._routes.withMutations((list: List) => {
      list.slice(0, this._index + 1).push(route);
    });

    return new RouteStack(routes.size - 1, routes);
  }

  /**
   * Returns a new stack a size ones less than this stack,
   * excluding the last index in this stack.
   */
  pop(): RouteStack {
    invariant(this._routes.size > 1, 'shoud not pop routes stack to empty');

    // When popping, removes the rest of the routes past the current index.
    var routes = this._routes.slice(0, this._index);
    return new RouteStack(routes.size - 1, routes);
  }

  jumpToIndex(index: number): RouteStack {
    invariant(
      index > -1 && index < this._routes.size,
      'index out of bound'
    );

    if (index === this._index) {
      return this;
    }

    return new RouteStack(index, this._routes);
  }

  /**
   * Replace a route in the navigation stack.
   *
   * `index` specifies the route in the stack that should be replaced.
   * If it's negative, it counts from the back.
   */
  replaceAtIndex(index: number, route: any): RouteStack {
    invariant(
      route === 0 ||
      route === false ||
      !!route,
      'Must supply route to replace'
    );

    if (this.get(index) === route) {
      return this;
    }

    invariant(this._routes.indexOf(route) === -1, 'route must be unique');

    if (index < 0) {
      index += this._routes.size;
    }

    invariant(
      index > -1 && index < this._routes.size,
      'index out of bound'
    );

    var routes = this._routes.set(index, route);
    return new RouteStack(this._index, routes);
  }
}

/**
 * The first class data structure for NavigationContext to manage the navigation
 * stack of routes.
 */
class NavigationRouteStack extends RouteStack {
  constructor(index: number, routes: Array) {
    // For now, `RouteStack` internally,  uses an immutable `List` to keep
    // track of routes. Since using `List` is really just the implementation
    // detail, we don't want to accept `routes` as `list` from constructor
    // for developer.
    super(index, new List(routes));
  }
}

module.exports = NavigationRouteStack;
