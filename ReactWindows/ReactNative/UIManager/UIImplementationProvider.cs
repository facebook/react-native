using ReactNative.Bridge;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Provides <see cref="UIImplementation"/> to use in the 
    /// <see cref="UIManagerModule"/>.
    /// </summary>
    public class UIImplementationProvider
    {
        /// <summary>
        /// Creates the <see cref="UIImplementation"/> instance.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="viewManagers">The view managers.</param>
        /// <returns></returns>
        public UIImplementation Create(
            ReactContext reactContext, 
            IReadOnlyList<IViewManager> viewManagers)
        {
            return new UIImplementation(reactContext, viewManagers);
        }
    }
}
