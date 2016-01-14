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
        public UIImplementation CreateUIImplementation(
            ReactContext reactContext, 
            IReadOnlyList<ViewManager> viewManagers)
        {
            return new UIImplementation(reactContext, viewManagers);
        }
    }
}
