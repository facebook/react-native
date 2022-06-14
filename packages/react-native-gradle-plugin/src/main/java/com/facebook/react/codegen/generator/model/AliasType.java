/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.codegen.generator.model;

public final class AliasType extends Type {
  public static final String TYPE_NAME = "TypeAliasTypeAnnotation";

  public final TypeId referredTypeId;

  public AliasType(final TypeId typeId, final TypeId referredTypeId) {
    super(typeId);
    this.referredTypeId = referredTypeId;
  }
}
