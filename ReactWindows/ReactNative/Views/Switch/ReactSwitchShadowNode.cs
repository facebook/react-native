using Facebook.CSSLayout;
using ReactNative.UIManager;

namespace ReactNative.Views.Switch
{
    /// <summary>
    /// Shadow node class for measuring <see cref="Windows.UI.Xaml.Controls.ToggleSwitch"/> instances.
    /// </summary>
    public class ReactSwitchShadowNode : LayoutShadowNode
    {
        /// <summary>
        /// Instantiates the <see cref="ReactSwitchShadowNode"/>.
        /// </summary>
        public ReactSwitchShadowNode()
        {
            MeasureFunction = MeasureSwitch;
        }

        private static MeasureOutput MeasureSwitch(CSSNode node, float width, float height)
        {
            // TODO: figure out how to properly measure the switch.
            return new MeasureOutput(56, 40);
        }
    }
}
