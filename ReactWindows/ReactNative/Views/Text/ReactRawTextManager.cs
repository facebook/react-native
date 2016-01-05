using ReactNative.UIManager;
using System;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.Text
{
    public class ReactRawTextManager : ReactTextViewManager
    {
        private const string ReactClass = "RCTRawText";

        public override string Name
        {
            get
            {
                return ReactClass;
            }
        }

        protected override TextBlock CreateViewInstanceCore(ThemedReactContext reactContext)
        {
            throw new InvalidOperationException("RCTRawText does not map to a native view.");
        }

        protected override void UpdateExtraData(TextBlock root, object extraData)
        {
        }

        protected override ReactTextShadowNode CreateShadowNodeInstanceCore()
        {
            return new ReactTextShadowNode(true);
        }
    }
}
