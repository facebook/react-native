using Facebook.CSSLayout;
using ReactNative.UIManager;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.Picker
{
    /// <summary>
    /// The shadow node implementation for Picker views.
    /// </summary>
    public class ReactPickerShadowNode : LayoutShadowNode
    {
        /// <summary>
        /// Instantiates the <see cref="ReactPickerShadowNode"/>.
        /// </summary>
        public ReactPickerShadowNode()
        {
            MeasureFunction = MeasurePicker;
        }

        private static MeasureOutput MeasurePicker(CSSNode node, float width, float height)
        {
            return new MeasureOutput(width, 40);
        }
    }
}
