/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NavigationEvent
 * @flow
 */
'use strict';

class NavigationEvent {
  type: String;
  target: Object;
  data: any;

  constructor(type: String, target: Object, data: any) {
    this.type = type;
    this.target = target;
    this.data = data;
  }
}

module.exports = NavigationEvent;
