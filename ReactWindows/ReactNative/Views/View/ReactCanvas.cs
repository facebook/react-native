using ReactNative.Touch;
using ReactNative.UIManager;
using Windows.Foundation;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Input;

namespace ReactNative.Views.View
{
    /// <summary>
    /// Backing for a react view.
    /// </summary>
    /// <remarks>
    /// TODO: Implement clipping.
    /// </remarks>
    public class ReactCanvas : Canvas
    {
        /// <summary>
        /// Provides the behavior for the measure pass of the layout cycle.
        /// </summary>
        /// <param name="availableSize">The available size.</param>
        /// <returns>The desired size.</returns>
        /// <remarks>
        /// Simple override that asserts that the desired size is explicit.
        /// </remarks>
        protected override Size MeasureOverride(Size availableSize)
        {
            var resultSize = base.MeasureOverride(availableSize);
            MeasureAssertions.AssertExplicitMeasurement(resultSize.Width, resultSize.Height);
            return resultSize;
        }
    }
}
