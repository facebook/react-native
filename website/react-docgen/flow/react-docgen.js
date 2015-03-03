/*
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 *
 */

type PropTypeDescriptor = {
  name: string;
  value?: any;
  raw?: string;
};

type PropDescriptor = {
  type?: PropTypeDescriptor;
  required?: boolean;
  defaultValue?: any;
  description?: string;
};

declare class Documentation {
  addComposes(moduleName: string): void;
  getDescription(): string;
  setDescription(description: string): void;
  getPropDescriptor(propName: string): PropDescriptor;
  toObject(): Object;
}


type Handler = (documentation: Documentation, path: NodePath) => void;
type Resolver =
  (node: ASTNode, recast: Recast) => (NodePath|Array<NodePath>|void);
