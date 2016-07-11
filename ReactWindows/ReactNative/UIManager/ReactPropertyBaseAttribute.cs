using System;

namespace ReactNative.UIManager
{
    /// <summary>
    /// A base class for common functionality across <see cref="ReactPropertyAttribute"/>
    /// and <see cref="ReactPropertyGroupAttribute"/>.
    /// </summary>
    public abstract class ReactPropertyBaseAttribute : Attribute
    {
        /// <summary>
        /// A type handle that signals to use the default type.
        /// </summary>
        public const string UseDefaultType = "__default_type__";

        /// <summary>
        /// The custom type name that should be sent to JavaScript.
        /// </summary>
        /// <remarks>
        /// In most cases, this should not be set. The custom type is meant to
        /// be used when additional processing of the value needs to occur in
        /// JavaScript before sending it over the bridge.
        /// </remarks>
        public string CustomType { get; set; } = UseDefaultType;

        /// <summary>
        /// The default value for boolean properties.
        /// </summary>
        public bool DefaultBoolean { get; set; } = false;

        /// <summary>
        /// The default value for byte properties.
        /// </summary>
        public byte DefaultByte { get; set; } = 0;

        /// <summary>
        /// The default value for decimal properties.
        /// </summary>
        public decimal DefaultDecimal { get; set; } = 0;

        /// <summary>
        /// The default value for double properties.
        /// </summary>
        public double DefaultDouble { get; set; } = 0.0;

        /// <summary>
        /// The default value for float properties.
        /// </summary>
        public float DefaultFloat { get; set; } = 0.0f;

        /// <summary>
        /// The default value for integers.
        /// </summary>
        public int DefaultInteger { get; set; } = 0;

        /// <summary>
        /// The default value for long integers.
        /// </summary>
        public long DefaultLong { get; set; }

        /// <summary>
        /// The default value for short integers.
        /// </summary>
        public short DefaultShort { get; set; } = 0;
    }
}
