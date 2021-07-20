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

export class Command {
  domain: string;
  name: string;
  description: ?string;
  experimental: ?boolean;
  parameters: Array<Property>;
  returns: Array<Property>;

  static create(
    domain: string,
    obj: any,
    ignoreExperimental: boolean,
  ): ?Command {
    return ignoreExperimental && obj.experimental
      ? null
      : new Command(domain, obj, ignoreExperimental);
  }

  constructor(domain: string, obj: any, ignoreExperimental: boolean) {
    this.domain = domain;
    this.name = obj.name;
    this.description = obj.description;
    this.experimental = obj.experimental;
    this.parameters = Property.createArray(
      domain,
      obj.parameters || [],
      ignoreExperimental,
    );
    this.returns = Property.createArray(
      domain,
      obj.returns || [],
      ignoreExperimental,
    );
  }

  getDebuggerName(): string {
    return `${this.domain}.${this.name}`;
  }

  getCppNamespace(): string {
    return toCppNamespace(this.domain);
  }

  getRequestCppType(): string {
    return toCppType(this.name + 'Request');
  }

  getResponseCppType(): ?string {
    if (this.returns && this.returns.length > 0) {
      return toCppType(this.name + 'Response');
    }
  }

  getForwardDecls(): Array<string> {
    const decls = [`struct ${this.getRequestCppType()};`];
    const respCppType = this.getResponseCppType();
    if (respCppType) {
      decls.push(`struct ${respCppType};`);
    }
    return decls;
  }

  getForwardDeclSortKey(): string {
    return this.getRequestCppType();
  }
}
