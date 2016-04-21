namespace ReactNative.UIManager
{
    /// <summary>
    /// Possible values for pointer events that a view and its descendants should
    /// receive. See https://developer.mozilla.org/en-US/docs/Web/CSS/pointer-events
    /// for more information.
    /// </summary>
    public enum PointerEvents
    {
        /// <summary>
        /// Neither the container nor its children receive events.
        /// </summary>
        None,

        /// <summary>
        /// Container does not get events but all its children do.
        /// </summary>
        BoxNone,

        /// <summary>
        /// Container gets events but none of its children do.
        /// </summary>
        BoxOnly,

        /// <summary>
        /// Container and all of its children receive touch events.
        /// </summary>
        Auto,
    }
}
