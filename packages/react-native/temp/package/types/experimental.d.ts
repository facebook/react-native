/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/**
 * These are types for things that are present for New Architecture enabled apps
 * which is currently considered experimental.
 *
 * To load the types declared here in an actual project, there are three ways.
 *
 * 1. If your `tsconfig.json` already has a `"types"` array in the `"compilerOptions"` section,
 * is to add `"react-native/types/experimental"` to the `"types"` array.
 *
 * 2. Alternatively, a specific import syntax can to be used from a typescript file.
 * This module does not exist in reality, which is why the {} is important:
 *
 * ```ts
 * import {} from 'react-native/types/experimental'
 * ```
 *
 * 3. It is also possible to include it through a triple-slash reference:
 *
 * ```ts
 * /// <reference types="react-native/types/experimental" />
 * ```
 *
 * Either the import or the reference only needs to appear once, anywhere in the project.
 */

import {
  GradientValue,
  BlendMode,
} from 'react-native/Libraries/StyleSheet/StyleSheetTypes';

export {};

declare module '.' {
  export interface ViewProps {
    /**
     * Contols whether this view, and its transitive children, are laid in a way
     * consistent with web browsers ('strict'), or consistent with existing
     * React Native code which may rely on incorrect behavior ('classic').
     */
    experimental_layoutConformance?: 'strict' | 'classic' | undefined;
  }

  export interface ViewStyle {
    experimental_mixBlendMode?: BlendMode | undefined;
    experimental_backgroundImage?:
      | ReadonlyArray<GradientValue>
      | string
      | undefined;
  }
}
