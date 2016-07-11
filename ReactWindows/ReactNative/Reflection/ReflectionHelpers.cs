using System;
using System.Linq.Expressions;
using System.Reflection;
using System.Threading.Tasks;

namespace ReactNative.Reflection
{
    /// <summary>
    /// Helpers for <see cref="MemberInfo"/>.
    /// </summary>
    static class ReflectionHelpers
    {
        /// <summary>
        /// Checks if a method is asynchronous.
        /// </summary>
        /// <param name="methodInfo">The method.</param>
        /// <returns>
        /// <b>true</b> if the method is asynchronous, <b>false</b> otherwise.
        /// </returns>
        public static bool IsAsync(this MethodInfo methodInfo)
        {
            return typeof(Task).IsAssignableFrom(methodInfo.ReturnType);
        }

        /// <summary>
        /// Gets the <see cref="MemberInfo"/> at the root of the expression.
        /// </summary>
        /// <param name="expression">The expression.</param>
        /// <returns>The reflected member.</returns>
        public static MemberInfo InfoOf(Expression<Action> expression)
        {
            return _InfoOf(expression.Body);
        }

        /// <summary>
        /// Gets the <see cref="MemberInfo"/> at the root of the expression.
        /// </summary>
        /// <typeparam name="T">Type of input.</typeparam>
        /// <param name="expression">The expression.</param>
        /// <returns>The reflected member.</returns>
        public static MemberInfo InfoOf<T>(Expression<Action<T>> expression)
        {
            return _InfoOf(expression.Body);
        }

        /// <summary>
        /// Gets the <see cref="MemberInfo"/> at the root of the expression.
        /// </summary>
        /// <typeparam name="T">Type of result.</typeparam>
        /// <param name="expression">The expression.</param>
        /// <returns>The reflected member.</returns>
        public static MemberInfo InfoOf<T>(Expression<Func<T>> expression)
        {
            return _InfoOf(expression.Body);
        }

        /// <summary>
        /// Gets the <see cref="MemberInfo"/> at the root of the expression.
        /// </summary>
        /// <typeparam name="TArgs">Type of input.</typeparam>
        /// <typeparam name="T">Type of result.</typeparam>
        /// <param name="expression">The expression.</param>
        /// <returns>The reflected member.</returns>

        public static MemberInfo InfoOf<TArgs, T>(Expression<Func<TArgs, T>> expression)
        {
            return _InfoOf(expression.Body);
        }

        /// <summary>
        /// Gets the <see cref="MemberInfo"/> at the root of the expression.
        /// </summary>
        /// <param name="expression">The expression.</param>
        /// <returns>The reflected member.</returns>
        public static MemberInfo InfoOf(Expression expression)
        {
            return _InfoOf(expression);
        }

        private static MemberInfo _InfoOf(Expression expression)
        {
            switch (expression.NodeType)
            {
                case ExpressionType.Call:
                    var callExpression = (MethodCallExpression)expression;
                    return callExpression.Method;
                case ExpressionType.MemberAccess:
                    var memberExpression = (MemberExpression)expression;
                    return memberExpression.Member;
                case ExpressionType.New:
                    var newExpression = (NewExpression)expression;
                    return newExpression.Constructor;
            }

            throw new InvalidOperationException("Expected either a method call, member access, or new expression.");
        }
    }
}
