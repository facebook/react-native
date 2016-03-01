using System;
using System.Collections.Generic;
using System.Globalization;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class that stores the mapping between the native view name used in
    /// JavaScript and the instance of <see cref="IViewManager"/>.
    /// </summary>
    public class ViewManagerRegistry
    {
        private readonly IDictionary<string, IViewManager> _registry;

        /// <summary>
        /// Instantiates the <see cref="ViewManagerRegistry"/>.
        /// </summary>
        /// <param name="viewManagers">
        /// The view managers to include in the registry.
        /// </param>
        public ViewManagerRegistry(IReadOnlyList<IViewManager> viewManagers)
        {
            if (viewManagers == null)
                throw new ArgumentNullException(nameof(viewManagers));

            _registry = new Dictionary<string, IViewManager>();

            foreach (var viewManager in viewManagers)
            {
                _registry.Add(viewManager.Name, viewManager);
            }
        }

        /// <summary>
        /// Gets the view manager for the given class name.
        /// </summary>
        /// <param name="className">The view manager class name.</param>
        /// <returns>The view manager.</returns>
        public IViewManager Get(string className)
        {
            if (className == null)
                throw new ArgumentNullException(nameof(className));

            var viewManager = default(IViewManager);
            if (_registry.TryGetValue(className, out viewManager))
            {
                return viewManager;
            }

            throw new ArgumentException(
                $"No view manager defined for class '{className}'.",
                nameof(className));
        }
    }
}
