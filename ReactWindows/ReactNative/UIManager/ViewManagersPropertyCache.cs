
using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    public class ViewManagersPropertyCache
    {
        private static readonly Dictionary<Type, Dictionary<string, PropSetter>> CLASS_PROPS_CACHE = new Dictionary<Type, Dictionary<string, PropSetter>>();
        private static readonly Dictionary<string, PropSetter> EMPTY_PROPS_MAP = new Dictionary<string, PropSetter>();

        abstract class PropSetter
        {
        }
    }
}
