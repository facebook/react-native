/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

/**
 * @flow
 */
"use strict";

class Documentation {
  _props: Object;
  _description: string;
  _composes: Array<string>;

  constructor() {
    this._props = {};
    this._description = '';
    this._composes = [];
  }

  addComposes(moduleName: string) {
    if (this._composes.indexOf(moduleName) === -1) {
      this._composes.push(moduleName);
    }
  }

  getDescription(): string {
    return this._description;
  }

  setDescription(description: string): void {
    this._description = description;
  }

  getPropDescriptor(propName: string): PropDescriptor {
    var propDescriptor = this._props[propName];
    if (!propDescriptor) {
      propDescriptor = this._props[propName] = {};
    }
    return propDescriptor;
  }

  toObject(): Object {
    var obj = {
      description: this._description,
      props: this._props
    };

    if (this._composes.length) {
      obj.composes = this._composes;
    }
    return obj;
  }
}

module.exports = Documentation;
