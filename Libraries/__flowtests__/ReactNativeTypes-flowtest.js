/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import * as React from 'react';
import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';

function takesHostComponentInstance(
  instance: React.ElementRef<HostComponent<mixed>> | null,
): void {}

const MyHostComponent = (('Host': any): HostComponent<mixed>);

<MyHostComponent
  ref={hostComponentRef => {
    takesHostComponentInstance(hostComponentRef);

    if (hostComponentRef == null) {
      return;
    }

    hostComponentRef.measureLayout(hostComponentRef, () => {});
  }}
/>;
