using System;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Annotates a group of properties of native views that should be exposed
    /// to JavaScript. It is a batched version of the 
    /// <see cref="ReactPropertyAttribute"/> annotation.
    /// </summary>
    /// <remarks>
    /// This annotation is meant to be used of similar properties. That is why
    /// it only supports a set of properties of the same type. A good example
    /// is supporting "border", where there are many variations of that
    /// property and each has very similar handling.
    /// 
    /// Each annotated method should return <see cref="void"/>.
    /// 
    /// In cases when the property has been removed from the corresponding 
    /// react component, the annotated setter will be called and a default
    /// value will be provided as a value parameter. Default values can be
    /// customized using, e.g., <see cref="DefaultInteger"/>. In all other
    /// case, <code>null</code> will be provided as a default.
    /// </remarks>
    [AttributeUsage(AttributeTargets.Method)]
    public class ReactPropertyGroupAttribute : ReactPropertyBaseAttribute
    {        
        /// <summary>
        /// Instantiates the <see cref="ReactPropertyGroupAttribute"/>.
        /// </summary>
        /// <param name="names">The property group names.</param>
        public ReactPropertyGroupAttribute(params string[] names)
        {
            Names = names;
        }

        /// <summary>
        /// The set of property group names.
        /// </summary>
        public string[] Names { get; }
    }
}
