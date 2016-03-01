using System;

namespace ReactNative.UIManager
{
    /// <summary>
    /// An annotation for properties of native vies that should be exposed to
    /// JavaScript.
    /// </summary>
    /// <remarks>
    /// Each annotated method should return <see cref="void"/>.
    /// 
    /// In cases when the property has been removed from the corresponding 
    /// react component, the annotated setter will be called and a default
    /// value will be provided as a value parameter. Default values can be
    /// customized using, e.g., <see cref="ReactPropertyBaseAttribute.DefaultInteger"/>. 
    /// In all other cases where the type is not a primitive, 
    /// <code>null</code> will be provided as a default.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Method)]
    public class ReactPropertyAttribute : ReactPropertyBaseAttribute
    {
        /// <summary>
        /// Instantiates the <see cref="ReactPropertyAttribute"/>.
        /// </summary>
        /// <param name="name">The property name.</param>
        public ReactPropertyAttribute(string name)
        {
            Name = name;
        }

        /// <summary>
        /// Name of the property exposed to JavaScript.
        /// </summary>
        public string Name { get; }
    }
}
