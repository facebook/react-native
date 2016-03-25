using System.Runtime.CompilerServices;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Helper methods for root view management.
    /// </summary>
    public static class RootViewHelper
    {
        private static readonly ConditionalWeakTable<FrameworkElement, FrameworkElement> s_parent =
            new ConditionalWeakTable<FrameworkElement, FrameworkElement>();

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

                var mapped = default(FrameworkElement);
                if (s_parent.TryGetValue(current, out mapped))
                {
                    current = mapped;
                }
                else
                {
                    current = (FrameworkElement)current.Parent;
                }
            }
        }

        /// <summary>
        /// Associate an element with its parent.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <param name="parent">The parent.</param>
        /// <remarks>
        /// TODO: (#302) Remove this shim.
        /// </remarks>
        internal static void SetParent(this FrameworkElement element, FrameworkElement parent)
        {
            RemoveParent(element);
            s_parent.Add(element, parent);
        }

        /// <summary>
        /// Unassociate a parent element.
        /// </summary>
        /// <param name="element">The element.</param>
        /// <remarks>
        /// TODO: (#302) Remove this shim.
        /// </remarks>
        internal static void RemoveParent(this FrameworkElement element)
        {
            s_parent.Remove(element);
        }
    }
}
