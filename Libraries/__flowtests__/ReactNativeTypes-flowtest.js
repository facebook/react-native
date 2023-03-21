/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {HostComponent} from '../Renderer/shims/ReactNativeTypes';

import * as React from 'react';

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
