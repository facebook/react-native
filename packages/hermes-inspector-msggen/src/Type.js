/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {jsTypeToCppType, toCppNamespace, toCppType} from './Converters';
import {Property} from './Property';

export class Type {
  domain: string;
  id: string;
  description: ?string;
  exported: ?boolean;
  experimental: ?boolean;

  static create(
    domain: string,
    obj: any,
    ignoreExperimental: boolean,
    includeExperimental: Set<string>,
  ): ?Type {
    let type = null;

    if (obj.type === 'object' && obj.properties) {
      type = new PropsType(
        domain,
        obj,
        ignoreExperimental,
        includeExperimental,
      );
    } else if (obj.type) {
      type = new PrimitiveType(domain, obj, ignoreExperimental);
    } else {
      throw new TypeError('Type requires `type` property.');
    }

    if (ignoreExperimental && type.experimental) {
      if (!includeExperimental.has(domain + '.' + type.id)) {
        type = null;
      }
    }

    return type;
  }

  constructor(domain: string, obj: any) {
    this.domain = domain;
    this.id = obj.id;
    this.description = obj.description;
    this.exported = obj.exported;
    this.experimental = obj.experimental;
  }

  getDebuggerName(): string {
    return `${this.domain}.${this.id}`;
  }

  getCppNamespace(): string {
    return toCppNamespace(this.domain);
  }

  getCppType(): string {
    return toCppType(this.id);
  }

  getForwardDecls(): Array<string> {
    throw new Error('subclass must implement');
  }

  getForwardDeclSortKey(): string {
    return this.getCppType();
  }
}

export class PrimitiveType extends Type {
  type: 'integer' | 'number' | 'object' | 'string';

  constructor(domain: string, obj: any, ignoreExperimental: boolean) {
    super(domain, obj);
    this.type = obj.type;
  }

  getForwardDecls(): Array<string> {
    return [`using ${this.getCppType()} = ${jsTypeToCppType(this.type)};`];
  }
}

export class PropsType extends Type {
  type: 'object';
  properties: Array<Property>;

  constructor(
    domain: string,
    obj: any,
    ignoreExperimental: boolean,
    includeExperimental: Set<string>,
  ) {
    super(domain, obj);
    this.type = obj.type;
    this.properties = Property.createArray(
      domain,
      obj.id,
      obj.properties || [],
      ignoreExperimental,
      includeExperimental,
    );
  }

  getForwardDecls(): Array<string> {
    return [`struct ${this.getCppType()};`];
  }
}
