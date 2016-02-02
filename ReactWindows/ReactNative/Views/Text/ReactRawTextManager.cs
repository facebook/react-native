using ReactNative.UIManager;
using System;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.Text
{
    /// <summary>
    /// A virtual view manager for raw text nodes.
    /// </summary>
    public class ReactRawTextManager : ReactTextViewManager
    {
        private const string ReactClass = "RCTRawText";

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
        /// Should not be called, as this is a virtual view manager.
        /// </summary>
        /// <param name="reactContext">Irrelevant.</param>
        /// <returns>Irrelevant.</returns>
        protected override TextBlock CreateViewInstanceCore(ThemedReactContext reactContext)
        {
            throw new InvalidOperationException("RCTRawText does not map to a native view.");
        }

        /// <summary>
        /// Should not be called, as this is a virtual view manager.
        /// </summary>
        /// <param name="root">Irrelevant.</param>
        /// <param name="extraData">Irrelevant.</param>
        protected override void UpdateExtraData(TextBlock root, object extraData)
        {
        }

        /// <summary>
        /// Creates a shadow node instance for a view.
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        protected override ReactTextShadowNode CreateShadowNodeInstanceCore()
        {
            return new ReactTextShadowNode(true);
        }
    }
}
