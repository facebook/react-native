using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using System;

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
    }
}
