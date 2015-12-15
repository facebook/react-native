using System;
using System.Linq.Expressions;

namespace ReactNative.Reflection
{
    static class ExpressionExtensions
    {
        public static T Let<TExpression, T>(this TExpression expression, Func<TExpression, T> selector)
            where TExpression : Expression
        {
            return selector(expression);
        }
    }
}
