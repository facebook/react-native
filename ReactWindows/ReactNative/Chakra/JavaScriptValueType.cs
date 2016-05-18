namespace ReactNative.Chakra
{
    /// <summary>
    ///     The JavaScript type of a JavaScriptValue.
    /// </summary>
    public enum JavaScriptValueType
    {
        /// <summary>
        ///     The value is the <c>undefined</c> value.
        /// </summary>
        Undefined = 0,

        /// <summary>
        ///     The value is the <c>null</c> value.
        /// </summary>
        Null = 1,

        /// <summary>
        ///     The value is a JavaScript number value.
        /// </summary>
        Number = 2,

        /// <summary>
        ///     The value is a JavaScript string value.
        /// </summary>
        String = 3,

        /// <summary>
        ///     The value is a JavaScript Boolean value.
        /// </summary>
        Boolean = 4,

        /// <summary>
        ///     The value is a JavaScript object value.
        /// </summary>
        Object = 5,

        /// <summary>
        ///     The value is a JavaScript function object value.
        /// </summary>
        Function = 6,

        /// <summary>
        ///     The value is a JavaScript error object value.
        /// </summary>
        Error = 7,

        /// <summary>
        ///     The value is a JavaScript array object value.
        /// </summary>
        Array = 8,
    }
}