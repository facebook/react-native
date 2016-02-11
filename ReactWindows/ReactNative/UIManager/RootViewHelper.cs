using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Helper methods for root view management.
    /// </summary>
    public static class RootViewHelper
    {
        /// <summary>
        /// Returns the root view of a givenview in a react application.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <returns>The root view instance.</returns>
        public static ReactRootView GetRootView(FrameworkElement view)
        {
            var current = view;
            while (true)
            {
                if (current == null)
                {
                    return null;
                }

                var rootView = current as ReactRootView;
                if (rootView != null)
                {
                    return rootView;
                }

                current = (FrameworkElement)current.Parent;
            }
        }
    }
}
