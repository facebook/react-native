@file:Suppress("DEPRECATION") // Suppressing as we want to test RCTEventEmitter here

package com.facebook.react.uimanager

import android.graphics.Matrix
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.spy
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class TouchTargetHelperTest {
  private lateinit var themedReactContext: ThemedReactContext
  private lateinit var rootViewGroup: ViewGroup

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    themedReactContext = ThemedReactContext(context, context, null, -1)
    rootViewGroup = ReactViewGroup(themedReactContext)
    rootViewGroup.id = 1
  }

  @Test
  fun testFindTargetTagForTouch_withZeroScaleView_returnsParent() {
    // Create a child view with zero scale
    val childView = createMockViewWithZeroScale()
    childView.id = 2
    rootViewGroup.addView(childView)

    // Position child view at 0,0 with 100x100 size
    childView.layout(0, 0, 100, 100)
    rootViewGroup.layout(0, 0, 200, 200)

    // Touch point that would normally hit the child view
    val targetTag = TouchTargetHelper.findTargetTagForTouch(50f, 50f, rootViewGroup)

    // Should return parent view's tag since child has zero scale
    assertThat(targetTag).isEqualTo(1)
  }

  @Test
  fun testFindTargetTagForTouch_withNormalScaleView_returnsChild() {
    // Create a child view with normal scale
    val childView = createMockViewWithNormalScale()
    childView.id = 2
    rootViewGroup.addView(childView)

    // Position child view at 0,0 with 100x100 size
    childView.layout(0, 0, 100, 100)
    rootViewGroup.layout(0, 0, 200, 200)

    // Touch point that hits the child view
    val targetTag = TouchTargetHelper.findTargetTagForTouch(50f, 50f, rootViewGroup)

    // Should return child view's tag
    assertThat(targetTag).isEqualTo(2)
  }

  @Test
  fun testFindTargetTagForTouch_withZeroScaleX_returnsParent() {
    val childView = createMockViewWithZeroScaleX()
    childView.id = 2
    rootViewGroup.addView(childView)

    childView.layout(0, 0, 100, 100)
    rootViewGroup.layout(0, 0, 200, 200)

    val targetTag = TouchTargetHelper.findTargetTagForTouch(50f, 50f, rootViewGroup)
    assertThat(targetTag).isEqualTo(1)
  }

  @Test
  fun testFindTargetTagForTouch_withZeroScaleY_returnsParent() {
    val childView = createMockViewWithZeroScaleY()
    childView.id = 2
    rootViewGroup.addView(childView)

    childView.layout(0, 0, 100, 100)
    rootViewGroup.layout(0, 0, 200, 200)

    val targetTag = TouchTargetHelper.findTargetTagForTouch(50f, 50f, rootViewGroup)
    assertThat(targetTag).isEqualTo(1)
  }

  @Test
  fun testFindTargetTagForTouch_withVerySmallButNonZeroScale_returnsParent() {
    val childView = createMockViewWithVerySmallScale()
    childView.id = 2
    rootViewGroup.addView(childView)

    childView.layout(0, 0, 100, 100)
    rootViewGroup.layout(0, 0, 200, 200)

    val targetTag = TouchTargetHelper.findTargetTagForTouch(50f, 50f, rootViewGroup)
    // Should return parent since very small scale is treated as zero
    assertThat(targetTag).isEqualTo(1)
  }

  @Test
  fun testFindTargetTagForTouch_withNonInvertibleMatrix_handlesGracefully() {
    val childView = createMockViewWithNonInvertibleMatrix()
    childView.id = 2
    rootViewGroup.addView(childView)

    childView.layout(0, 0, 100, 100)
    rootViewGroup.layout(0, 0, 200, 200)

    // Should not crash and handle the non-invertible matrix case
    val targetTag = TouchTargetHelper.findTargetTagForTouch(50f, 50f, rootViewGroup)
    // Since matrix can't be inverted (due to zero scale), should return parent
    assertThat(targetTag).isEqualTo(1)
  }

  @Test
  fun testFindTargetPathAndCoordinatesForTouch_withZeroScaleView_excludesFromPath() {
    val childView = createMockViewWithZeroScale()
    childView.id = 2
    rootViewGroup.addView(childView)

    childView.layout(0, 0, 100, 100)
    rootViewGroup.layout(0, 0, 200, 200)

    val eventCoords = FloatArray(2)
    val path = TouchTargetHelper.findTargetPathAndCoordinatesForTouch(
        50f, 50f, rootViewGroup, eventCoords)

    // Path should not include the zero-scale child view
    val viewIds = path.map { it.getViewId() }
    assertThat(viewIds).doesNotContain(2)
  }

  @Test
  fun testFindTargetTagAndCoordinatesForTouch_withZeroScaleNestedView() {
    // Create a hierarchy: root -> parent -> child (zero scale)
    val parentView = ReactViewGroup(themedReactContext)
    parentView.id = 2
    val childView = createMockViewWithZeroScale()
    childView.id = 3

    rootViewGroup.addView(parentView)
    parentView.addView(childView)

    // Layout the views
    rootViewGroup.layout(0, 0, 200, 200)
    parentView.layout(0, 0, 150, 150)
    childView.layout(0, 0, 100, 100)

    val eventCoords = FloatArray(2)
    val targetTag = TouchTargetHelper.findTargetTagAndCoordinatesForTouch(
        50f, 50f, rootViewGroup, eventCoords, null)

    // Should return parent view since child has zero scale
    assertThat(targetTag).isEqualTo(2)
  }

  @Test
  fun testMatrix_identityMatrix_isNotZeroScale() {
    val view = ReactViewGroup(themedReactContext)
    view.id = 1

    // Identity matrix should not be considered zero scale
    val targetTag = TouchTargetHelper.findTargetTagForTouch(10f, 10f, view)
    assertThat(targetTag).isEqualTo(1)
  }

  private fun createMockViewWithZeroScale(): View {
    val view = spy(ReactViewGroup(themedReactContext))
    val matrix = Matrix()
    matrix.setScale(0f, 0f)
    whenever(view.matrix) doReturn matrix
    return view
  }

  private fun createMockViewWithZeroScaleX(): View {
    val view = spy(ReactViewGroup(themedReactContext))
    val matrix = Matrix()
    matrix.setScale(0f, 1f)
    whenever(view.matrix) doReturn matrix
    return view
  }

  private fun createMockViewWithZeroScaleY(): View {
    val view = spy(ReactViewGroup(themedReactContext))
    val matrix = Matrix()
    matrix.setScale(1f, 0f)
    whenever(view.matrix) doReturn matrix
    return view
  }

  private fun createMockViewWithVerySmallScale(): View {
    val view = spy(ReactViewGroup(themedReactContext))
    val matrix = Matrix()
    // Scale smaller than epsilon (0.00001f)
    matrix.setScale(0.000001f, 0.000001f)
    whenever(view.matrix) doReturn matrix
    return view
  }

  private fun createMockViewWithNormalScale(): View {
    val view = spy(ReactViewGroup(themedReactContext))
    val matrix = Matrix()
    matrix.setScale(1f, 1f)
    whenever(view.matrix) doReturn matrix
    return view
  }

  private fun createMockViewWithNonInvertibleMatrix(): View {
    val view = spy(ReactViewGroup(themedReactContext))
    val matrix = mock<Matrix>()

    // Mock a matrix that claims to be non-identity but can't be inverted
    whenever(matrix.isIdentity) doReturn false
    whenever(matrix.invert(org.mockito.kotlin.any())) doReturn false // Can't be inverted

    // Mock the getValues method to set zero scale values
    org.mockito.kotlin.doAnswer { invocation ->
      val values = invocation.getArgument<FloatArray>(0)
      values[Matrix.MSCALE_X] = 0f  // Zero scale X
      values[Matrix.MSCALE_Y] = 0f  // Zero scale Y
      Unit
    }.whenever(matrix).getValues(org.mockito.kotlin.any())

    whenever(view.matrix) doReturn matrix
    return view
  }
}
