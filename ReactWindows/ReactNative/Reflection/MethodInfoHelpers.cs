using System.Reflection;
using System.Threading.Tasks;

namespace ReactNative.Reflection
{
    static class MethodInfoHelpers
    {
        public static bool IsAsync(this MethodInfo methodInfo)
        {
            return typeof(Task).IsAssignableFrom(methodInfo.ReturnType);
        }
    }
}
