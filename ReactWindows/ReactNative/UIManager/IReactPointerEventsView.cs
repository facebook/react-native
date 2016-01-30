namespace ReactNative.UIManager
{
    /// <summary>
    /// This interface should be implemented be native <see cref="Panel"/> subclasses that support pointer 
    /// events handling.It is used to find the target View of a touch event.
    /// </summary>
    public interface IReactPointerEventsView
    {
        /// <summary>
        /// Return the pointer events of the view.
        /// </summary>
        PointerEvents PointerEvents { get; }
    }
}
