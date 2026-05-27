/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef WITH_PERFETTO

#include "ReactPerfettoCategories.h"

PERFETTO_TRACK_EVENT_STATIC_STORAGE_IN_NAMESPACE(facebook::react);
PERFETTO_USE_CATEGORIES_FROM_NAMESPACE(facebook::react);

#endif
