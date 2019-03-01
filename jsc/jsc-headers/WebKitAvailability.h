/*
 * Copyright (C) 2008, 2009, 2010, 2014 Apple Inc. All Rights Reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef __WebKitAvailability__
#define __WebKitAvailability__

#if defined(__APPLE__)

#include <AvailabilityMacros.h>
#include <CoreFoundation/CoreFoundation.h>

#if !TARGET_OS_IPHONE && __MAC_OS_X_VERSION_MIN_REQUIRED < 101100
/* To support availability macros that mention newer OS X versions when building on older OS X versions,
   we provide our own definitions of the underlying macros that the availability macros expand to. We're
   free to expand the macros as no-ops since frameworks built on older OS X versions only ship bundled with
   an application rather than as part of the system.
*/

#ifndef __NSi_10_10 // Building from trunk rather than SDK.
#define __NSi_10_10 introduced=10.0 // Use 10.0 to indicate that everything is available.
#endif

#ifndef __NSi_10_11 // Building from trunk rather than SDK.
#define __NSi_10_11 introduced=10.0 // Use 10.0 to indicate that everything is available.
#endif

#ifndef __NSi_10_12 // Building from trunk rather than SDK.
#define __NSi_10_12 introduced=10.0 // Use 10.0 to indicate that everything is available.
#endif

#ifndef __AVAILABILITY_INTERNAL__MAC_10_9
#define __AVAILABILITY_INTERNAL__MAC_10_9
#endif

#ifndef __AVAILABILITY_INTERNAL__MAC_10_10
#define __AVAILABILITY_INTERNAL__MAC_10_10
#endif

#ifndef AVAILABLE_MAC_OS_X_VERSION_10_9_AND_LATER
#define AVAILABLE_MAC_OS_X_VERSION_10_9_AND_LATER
#endif

#ifndef AVAILABLE_MAC_OS_X_VERSION_10_10_AND_LATER
#define AVAILABLE_MAC_OS_X_VERSION_10_10_AND_LATER
#endif

#endif /* !TARGET_OS_IPHONE && __MAC_OS_X_VERSION_MIN_REQUIRED < 101100 */

#if defined(BUILDING_GTK__)
#undef CF_AVAILABLE
#define CF_AVAILABLE(_mac, _ios)
#undef CF_ENUM_AVAILABLE
#define CF_ENUM_AVAILABLE(_mac, _ios)
#endif

#else
#define CF_AVAILABLE(_mac, _ios)
#define CF_ENUM_AVAILABLE(_mac, _ios)
#endif

#endif /* __WebKitAvailability__ */
