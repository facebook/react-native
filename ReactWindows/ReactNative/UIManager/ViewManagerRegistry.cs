
namespace ReactNative.UIManager
{
    using UIManager;
    using System;
    using System.Collections.Generic;
    using Windows.UI.Xaml;

    public class ViewManagerRegistry
    {
        private readonly Dictionary<string, ViewManager<FrameworkElement, ReactShadowNode>> mViewManagers = new Dictionary<string, ViewManager<FrameworkElement, ReactShadowNode>>();

        public ViewManagerRegistry(List<ViewManager<FrameworkElement, ReactShadowNode>> viewManagerList)
        {
            foreach (var viewManager in viewManagerList)
            {
                mViewManagers.Add(viewManager.getName(), viewManager);
            }
        }

        public ViewManager<FrameworkElement, ReactShadowNode> get(String className)
        {
            var viewManager = mViewManagers[className];
            if (viewManager != null)
            {
                return viewManager;
            }
            else
            {
                throw new ArgumentException("No ViewManager defined for class " + className);
            }
        }
    }
}
