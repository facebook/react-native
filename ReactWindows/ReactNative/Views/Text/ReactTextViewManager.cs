using ReactNative.UIManager;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Documents;

namespace ReactNative.Views.Text
{
    /// <summary>
    /// The view manager for text views.
    /// </summary>
    public class ReactTextViewManager : BaseViewManager<TextBlock, ReactTextShadowNode>
    {
        private const string ReactClass = "RCTText";

        /// <summary>
        /// The name of the view manager.
        /// </summary>
        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

        /// <summary>
        /// Creates the shadow node instance.
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        public override ReactTextShadowNode CreateShadowNodeInstance()
        {
            return new ReactTextShadowNode(false);
        }

        /// <summary>
        /// Updates the node with the changes to the inner virtual nodes.
        /// </summary>
        /// <param name="root">The view instance.</param>
        /// <param name="extraData">The aggregated virtual node changes.</param>
        public override void UpdateExtraData(TextBlock root, object extraData)
        {
            var inline = (Inline)extraData;
            root.Inlines.Clear();
            root.Inlines.Add(inline);
        }

        /// <summary>
        /// Creates the view instance.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override TextBlock CreateViewInstance(ThemedReactContext reactContext)
        {
            return new TextBlock
            {
                TextWrapping = TextWrapping.Wrap,
            };
        }
    }
}
