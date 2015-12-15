using System;
using System.Linq.Expressions;
using System.Reflection;

namespace ReactNative.Reflection
{
    static class ReflectionHelpers
    {
        public static MemberInfo InfoOf(Expression<Action> expression)
        {
            return _InfoOf(expression.Body);
        }

        public static MemberInfo InfoOf<T>(Expression<Func<T>> expression)
        {
            return _InfoOf(expression.Body);
        }

        public static MemberInfo InfoOf<TArgs, T>(Expression<Func<TArgs, T>> expression)
        {
            return _InfoOf(expression.Body);
        }

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
