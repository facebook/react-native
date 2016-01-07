using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using System;
using System.Threading.Tasks;

namespace ReactNative.Tests
{
    static class AssertEx
    {
        public static void Throws<T>(Action action)
            where T : Exception
        {
            Throws<T>(action, _ => { });
        }

        public static void Throws<T>(Action action, Action<T> assert)
            where T : Exception
        {
            try
            {
                action();
            }
            catch (T ex)
            {
                assert(ex);
                return;
            }

            Assert.Fail("Excepted exception of type '{0}'.", typeof(T));
        }

        public static Task ThrowsAsync<T>(Func<Task> action)
            where T : Exception
        {
            return ThrowsAsync<T>(action, _ => { });
        }

        public static async Task ThrowsAsync<T>(Func<Task> action, Action<T> assert)
            where T : Exception
        {
            try
            {
                await action();
            }
            catch (T ex)
            {
                assert(ex);
                return;
            }

            Assert.Fail("Excepted exception of type '{0}'.", typeof(T));
        }
    }
}
