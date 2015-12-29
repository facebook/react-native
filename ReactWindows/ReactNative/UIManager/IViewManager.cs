using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Base, non-generic interface for view managers.
    /// </summary>
    public interface IViewManager
    {
        /// <summary>
        /// The name of the view manager.
        /// </summary>
        string Name { get; }

        /// <summary>
        /// The commands map for the view manager.
        /// </summary>
        IReadOnlyDictionary<string, object> CommandsMap { get; }

        /// <summary>
        /// The exported custom bubbling event types.
        /// </summary>
        IReadOnlyDictionary<string, object> ExportedCustomBubblingEventTypeConstants { get; }
        
        /// <summary>
        /// The exported custom direct event types.
        /// </summary>
        IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants { get; }

        /// <summary>
        /// The exported view constants.
        /// </summary>
        IReadOnlyDictionary<string, object> ExportedViewConstants { get; }

        /// <summary>
        /// The native properties.
        /// </summary>
        IReadOnlyDictionary<string, string> NativeProperties { get; }

        /// <summary>
        /// Creates a shadow node for the view manager.
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        ReactShadowNode CreateShadowNodeInstance();
    }
}
