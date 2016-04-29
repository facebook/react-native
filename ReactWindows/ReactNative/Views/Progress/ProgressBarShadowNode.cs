using Facebook.CSSLayout;
using ReactNative.UIManager;

namespace ReactNative.Views.Progress
{
    class ProgressBarShadowNode : LayoutShadowNode
    {
        public ProgressBarShadowNode()
        {
            MeasureFunction = MeasureProgressBar;
        }

        private static MeasureOutput MeasureProgressBar(CSSNode node, float width, float height)
        {
            var adjustedHeight = CSSConstants.IsUndefined(height) ? 4 : height; 
            return new MeasureOutput(width, adjustedHeight);
        }
    }
}
