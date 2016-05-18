using System.Runtime.CompilerServices;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Base class for <see cref="IJavaScriptModule"/>s.
    /// </summary>
    public abstract partial class JavaScriptModuleBase : IJavaScriptModule
    {
        /// <summary>
        /// Invoke a JavaScript method with the given arguments.
        /// </summary>
        /// <param name="caller">
        /// The name of the method. This parameter may be ignored if the name
        /// of the native method matches the name of the JavaScript method. The
        /// method name will be filled in automatically using the
        /// <see cref="CallerMemberNameAttribute"/>.
        /// </param>
        /// <remarks>
        /// The expectation is that <see cref="IJavaScriptModule"/>s will use
        /// this method to notify the framework of a JavaScript call to be
        /// executed. This is to overcome the absense of a performant "proxy"
        /// implementation in the .NET framework.
        /// </remarks>
        protected void Invoke([CallerMemberName]string caller = null)
        {
            Invoke(default(object[]), caller);
        }

        /// <summary>
        /// Invoke a JavaScript method with the given arguments.
        /// </summary>
        /// <param name="arg0">The first argument.</param>
        /// <param name="caller">
        /// The name of the method. This parameter may be ignored if the name
        /// of the native method matches the name of the JavaScript method. The
        /// method name will be filled in automatically using the
        /// <see cref="CallerMemberNameAttribute"/>.
        /// </param>
        /// <remarks>
        /// The expectation is that <see cref="IJavaScriptModule"/>s will use
        /// this method to notify the framework of a JavaScript call to be
        /// executed. This is to overcome the absense of a performant "proxy"
        /// implementation in the .NET framework.
        /// </remarks>
        protected void Invoke(object arg0, [CallerMemberName]string caller = null)
        {
            Invoke(new[] { arg0 }, caller);
        }

        /// <summary>
        /// Invoke a JavaScript method with the given arguments.
        /// </summary>
        /// <param name="arg0">The first argument.</param>
        /// <param name="arg1">The second argument.</param>
        /// <param name="caller">
        /// The name of the method. This parameter may be ignored if the name
        /// of the native method matches the name of the JavaScript method. The
        /// method name will be filled in automatically using the
        /// <see cref="CallerMemberNameAttribute"/>.
        /// </param>
        /// <remarks>
        /// The expectation is that <see cref="IJavaScriptModule"/>s will use
        /// this method to notify the framework of a JavaScript call to be
        /// executed. This is to overcome the absense of a performant "proxy"
        /// implementation in the .NET framework.
        /// </remarks>
        protected void Invoke(object arg0, object arg1, [CallerMemberName]string caller = null)
        {
            Invoke(new[] { arg0, arg1 }, caller);
        }

        /// <summary>
        /// Invoke a JavaScript method with the given arguments.
        /// </summary>
        /// <param name="arg0">The first argument.</param>
        /// <param name="arg1">The second argument.</param>
        /// <param name="arg2">The third argument.</param>
        /// <param name="caller">
        /// The name of the method. This parameter may be ignored if the name
        /// of the native method matches the name of the JavaScript method. The
        /// method name will be filled in automatically using the
        /// <see cref="CallerMemberNameAttribute"/>.
        /// </param>
        /// <remarks>
        /// The expectation is that <see cref="IJavaScriptModule"/>s will use
        /// this method to notify the framework of a JavaScript call to be
        /// executed. This is to overcome the absense of a performant "proxy"
        /// implementation in the .NET framework.
        /// </remarks>
        protected void Invoke(object arg0, object arg1, object arg2, [CallerMemberName]string caller = null)
        {
            Invoke(new[] { arg0, arg1, arg2 }, caller);
        }

        /// <summary>
        /// Invoke a JavaScript method with the given arguments.
        /// </summary>
        /// <param name="arg0">The first argument.</param>
        /// <param name="arg1">The second argument.</param>
        /// <param name="arg2">The third argument.</param>
        /// <param name="arg3">The fourth argument.</param>
        /// <param name="caller">
        /// The name of the method. This parameter may be ignored if the name
        /// of the native method matches the name of the JavaScript method. The
        /// method name will be filled in automatically using the
        /// <see cref="CallerMemberNameAttribute"/>.
        /// </param>
        /// <remarks>
        /// The expectation is that <see cref="IJavaScriptModule"/>s will use
        /// this method to notify the framework of a JavaScript call to be
        /// executed. This is to overcome the absense of a performant "proxy"
        /// implementation in the .NET framework.
        /// </remarks>
        protected void Invoke(object arg0, object arg1, object arg2, object arg3, [CallerMemberName]string caller = null)
        {
            Invoke(new[] { arg0, arg1, arg2, arg3 }, caller);
        }

    }
}