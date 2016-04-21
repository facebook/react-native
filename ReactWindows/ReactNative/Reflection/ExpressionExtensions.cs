using System;
using System.Linq.Expressions;

namespace ReactNative.Reflection
{
    /// <summary>
    /// Helper methods for expressions.
    /// </summary>
    static class ExpressionExtensions
    {
        /// <summary>
        /// Transforms an expression into a parameter that can be used in
        /// multiple places in a larger expression. Particularly useful for
        /// declaring parameters in a <see cref="LambdaExpression"/>.
        /// </summary>
        /// <typeparam name="TExpression">Expression type.</typeparam>
        /// <typeparam name="T">Result type.</typeparam>
        /// <param name="expression">The expression.</param>
        /// <param name="selector">The result selector.</param>
        /// <returns>The result.</returns>
        public static T Let<TExpression, T>(this TExpression expression, Func<TExpression, T> selector)
            where TExpression : Expression
        {
            return selector(expression);
        }
    }
}
