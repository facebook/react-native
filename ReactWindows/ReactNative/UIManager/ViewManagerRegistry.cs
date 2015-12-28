
namespace ReactNative.UIManager
{
    using UIManager;
    using System;
    using System.Collections.Generic;
    using Windows.UI.Xaml;

    public class ViewManagerRegistry
    {
        private readonly Dictionary<string, IViewManager> mViewManagers =
            new Dictionary<string, IViewManager>();

        public ViewManagerRegistry(IReadOnlyList<IViewManager> viewManagerList)
        {
            foreach (var viewManager in viewManagerList)
            {
                mViewManagers.Add(viewManager.Name, viewManager);
            }
        }

        public IViewManager get(string className)
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
