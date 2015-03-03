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
 * A minimal set of declarations to make flow work with the recast API.
 */

type ASTNode = Object;

declare class Scope {
  lookup(name: string): ?Scope;
  getBindings(): Object<string, Array<NodePath>>;
}

declare class NodePath {
  node: ASTNode;
  parent: NodePath;
  scope: Scope;

  get(...x: (string|number)): NodePath;
  each(f: (p: NodePath) => void): void;
  map<T>(f: (p: NodePath) => T): Array<T>;
}

type Recast = {
  parse: (src: string) => ASTNode;
  print: (path: NodePath) => {code: string};
};
