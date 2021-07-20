/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import {Property} from './Property';
import {toCppNamespace, toCppType} from './Converters';

export class Event {
  domain: string;
  name: string;
  description: ?string;
  experimental: ?boolean;
  parameters: Array<Property>;

  static create(domain: string, obj: any, ignoreExperimental: boolean): ?Event {
    return ignoreExperimental && obj.experimental
      ? null
      : new Event(domain, obj, ignoreExperimental);
  }

  constructor(domain: string, obj: any, ignoreExperimental: boolean) {
    this.domain = domain;
    this.name = obj.name;
    this.description = obj.description;
    this.parameters = Property.createArray(
      domain,
      obj.parameters || [],
      ignoreExperimental,
    );
  }

  getDebuggerName(): string {
    return `${this.domain}.${this.name}`;
  }

  getCppNamespace(): string {
    return toCppNamespace(this.domain);
  }

  getCppType(): string {
    return toCppType(this.name + 'Notification');
  }

  getForwardDecls(): Array<string> {
    return [`struct ${this.getCppType()};`];
  }

  getForwardDeclSortKey(): string {
    return this.getCppType();
  }
}
