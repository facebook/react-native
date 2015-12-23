using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Delegate of <see cref="UIManagerModule"/> that owns the native view hierarchy and mapping between
    /// native view names used in JS and corresponding instances of <see cref="ViewManager"/>
    /// </summary>
    public class NativeViewHierarchyManager
    {
        private readonly Dictionary<int, ViewManager<FrameworkElement, ReactShadowNode>> _TagsToViewManagers;
        private readonly ViewManagerRegistry _ViewManagers;

        public NativeViewHierarchyManager(ViewManagerRegistry viewManagers)
        {
            _ViewManagers = viewManagers;
            _TagsToViewManagers = new Dictionary<int, ViewManager<FrameworkElement, ReactShadowNode>>();
        }
    }
}
