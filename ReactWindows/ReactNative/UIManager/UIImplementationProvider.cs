
using ReactNative.Bridge;
using ReactNative.UIManager;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Provides UIImplementation to use in <see cref="UIManagerModule" />
    /// </summary>
    public class UIImplementationProvider
    {
        public UIImplementation createUIImplementation(ReactApplicationContext reactContext, List<ViewManager<FrameworkElement, ReactShadowNode>> viewManagers)
        {
            return new UIImplementation(reactContext, viewManagers);
        }
    }
}
