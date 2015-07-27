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
 * @providesModule NavigationEvent
 * @flow
 */
'use strict';

var invariant = require('invariant');

class NavigationEventPool {
  _list: Array<any>;

  constructor() {
    this._list = [];
  }

  get(type: string, target: Object, data: any): NavigationEvent {
    var event;
    if (this._list.length > 0) {
      event = this._list.pop();
      event.constructor.call(event, type, target, data);
    } else {
      event = new NavigationEvent(type, target, data);
    }
    return event;
  }

  put(event: NavigationEvent) {
    this._list.push(event);
  }
}

var _navigationEventPool = new NavigationEventPool();

class NavigationEvent {
  _data: any;
  _defaultPrevented: boolean;
  _disposed: boolean;
  _target: ?Object;
  _type: ?string;

  static pool(type: string, target: Object, data: any): NavigationEvent {
    return _navigationEventPool.get(type, target, data);
  }

  constructor(type: string, target: Object, data: any) {
    this._type = type;
    this._target = target;
    this._data = data;
    this._defaultPrevented = false;
    this._disposed = false;
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get type(): string {
    return this._type;
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get target(): Object {
    return this._target;
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get data(): any {
    return this._data;
  }

  /* $FlowFixMe - get/set properties not yet supported */
  get defaultPrevented(): boolean {
    return this._defaultPrevented;
  }

  preventDefault(): void {
    this._defaultPrevented = true;
  }

  /**
   * Dispose the event.
   * NavigationEvent shall be disposed after being emitted by
   * `NavigationEventEmitter`.
   */
  dispose(): void {
    invariant(!this._disposed, 'NavigationEvent is already disposed');
    this._disposed = true;

    // Clean up.
    this._type = null;
    this._target = null;
    this._data = null;
    this._defaultPrevented = false;

    // Put this back to the pool to reuse the instance.
    _navigationEventPool.put(this);
  }
}

module.exports = NavigationEvent;
