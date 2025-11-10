# iOS Shadow Recycling Bug Fix - Issue #54204

## Problem
When navigating to the same screen twice containing a View with shadow styles, duplicate shadows appeared on random views due to improper component recycling cleanup.

## Root Cause
The `prepareForRecycle` method in `RCTViewComponentView.mm` was not cleaning up visual layers (`_boxShadowLayers`, `_backgroundColorLayer`, etc.), causing them to persist and get incorrectly applied to recycled components.

## Solution
Added comprehensive visual layer cleanup in the `prepareForRecycle` method:

```objc
// COMPREHENSIVE LAYER CLEANUP FOR RECYCLING
// Clean up box shadow layers to prevent cross-component contamination
if (_boxShadowLayers) {
  for (CALayer *boxShadowLayer in _boxShadowLayers) {
    [boxShadowLayer removeFromSuperlayer];
  }
  [_boxShadowLayers removeAllObjects];
  _boxShadowLayers = nil;
}

// Clean up other visual layers
[_backgroundColorLayer removeFromSuperlayer];
_backgroundColorLayer = nil;
[_borderLayer removeFromSuperlayer];
_borderLayer = nil;
[_outlineLayer removeFromSuperlayer];
_outlineLayer = nil;
[_filterLayer removeFromSuperlayer];
_filterLayer = nil;
[self clearExistingBackgroundImageLayers];
```

## Benefits
- ✅ Prevents duplicate shadows on component recycling
- ✅ Comprehensive cleanup prevents similar issues with other visual effects
- ✅ Memory efficient - properly nullifies references
- ✅ Future-proof - addresses root cause rather than just symptoms
- ✅ Consistent with existing cleanup patterns in `invalidateLayer`

## Files Changed
- `packages/react-native/React/Fabric/Mounting/ComponentViews/View/RCTViewComponentView.mm`

## Testing
- All existing tests pass
- Fix addresses the specific scenario described in issue #54204
- No regressions in component recycling functionality

## Ready for PR
The fix is minimal, targeted, and ready for submission to the React Native repository.