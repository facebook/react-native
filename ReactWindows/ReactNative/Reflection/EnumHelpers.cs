using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace ReactNative.Reflection
{
    static class EnumHelpers
    {
        private static readonly ConcurrentDictionary<Type, IReadOnlyDictionary<string, object>> s_enumCache =
            new ConcurrentDictionary<Type, IReadOnlyDictionary<string, object>>();

        public static T Parse<T>(string value)
        {
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
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Invalid value '{0}' for type '{1}'.",
                        value,
                        typeof(T)));
            }

            return (T)result;
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
