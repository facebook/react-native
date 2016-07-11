namespace ReactNative.UIManager.Events
{
    /// <summary>
    /// Touch event types that the JavaScript module <see cref="RCTEventEmitter"/>
    /// understands.
    /// </summary>
    public enum TouchEventType
    {
        /// <summary>
        /// Touch start event type.
        /// </summary>
        Start,

        /// <summary>
        /// Touch end event type.
        /// </summary>
        End,

        /// <summary>
        /// Touch move event type.
        /// </summary>
        Move,

        /// <summary>
        /// Touch cancel event type.
        /// </summary>
        Cancel,
    }
}
