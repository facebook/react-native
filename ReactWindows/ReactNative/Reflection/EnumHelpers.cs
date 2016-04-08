using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace ReactNative.Reflection
{
    static partial class EnumHelpers
    {
        private static readonly ConcurrentDictionary<Type, IReadOnlyDictionary<string, object>> s_enumCache =
            new ConcurrentDictionary<Type, IReadOnlyDictionary<string, object>>();

        public static T Parse<T>(string value)
        {
#if NO_REFLECTION
            return ParseStatic<T>(value);
#else
            var lookup = s_enumCache.GetOrAdd(
                typeof(T),
                type => Enum.GetValues(type)
                    .Cast<object>()
                    .ToDictionary(
                        e => Normalize(e.ToString()),
                        e => e));

            var result = default(object);
            if (!lookup.TryGetValue(Normalize(value), out result))
            {
                throw new ArgumentOutOfRangeException(
                    nameof(value),
                    $"Invalid value '{value}' for type '{typeof(T)}'.");
            }

            return (T)result;
#endif
        }

        public static T? ParseNullable<T>(string value)
            where T : struct
        {
            if (value == null)
                return null;

            return Parse<T>(value);
        }

        private static string Normalize(string value)
        {
            return value.ToLowerInvariant().Replace("-", "");
        }
    }
}
