/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @providesModule NavigationTreeNode
 * @flow
 */
'use strict';

var invariant = require('fbjs/lib/invariant');
var immutable = require('immutable');

var {List} = immutable;

/**
 * Utility to build a tree of nodes.
 * Note that this tree does not perform cyclic redundancy check
 * while appending child node.
 */
class NavigationTreeNode {
  __parent: ?NavigationTreeNode;

  _children: List<NavigationTreeNode>;

  _value: any;

  constructor(value: any) {
    this.__parent = null;
    this._children = new List();
    this._value = value;
  }

  getValue(): any {
    return this._value;
  }

  getParent(): ?NavigationTreeNode {
    return this.__parent;
  }

  getChildrenCount(): number {
    return this._children.size;
  }

  getChildAt(index: number): ?NavigationTreeNode {
    return index > -1 && index < this._children.size ?
      this._children.get(index) :
      null;
  }

  appendChild(child: NavigationTreeNode): void {
    if (child.__parent) {
      child.__parent.removeChild(child);
    }
    child.__parent = this;
    this._children = this._children.push(child);
  }

  removeChild(child: NavigationTreeNode): void {
    var index = this._children.indexOf(child);

    invariant(
      index > -1,
      'The node to be removed is not a child of this node.'
    );

    child.__parent = null;

    this._children = this._children.splice(index, 1);
  }

  indexOf(child: NavigationTreeNode): number {
    return this._children.indexOf(child);
  }

  forEach(callback: Function, context: any): void {
    this._children.forEach(callback, context);
  }

  map(callback: Function, context: any): Array<NavigationTreeNode> {
    return this._children.map(callback, context).toJS();
  }

  some(callback: Function, context: any): boolean {
    return this._children.some(callback, context);
  }
}


module.exports = NavigationTreeNode;
