using System;
using System.Runtime.CompilerServices;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Base class for <see cref="IJavaScriptModule"/>s.
    /// </summary>
    public abstract partial class JavaScriptModuleBase : IJavaScriptModule
    {
        private IInvocationHandler _invokeHandler;

        /// <summary>
        /// The invocation handler.
        /// </summary>
        public IInvocationHandler InvocationHandler
        {
            set
            {
                if (_invokeHandler != null)
                {
                    throw new InvalidOperationException("InvokeHandler set more than once.");
                }

                _invokeHandler = value;
            }
        }

        /// <summary>
        /// Invoke a JavaScript method with the given arguments.
        /// </summary>
        /// <param name="args">The arguments.</param>
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
        protected void Invoke(object[] args, [CallerMemberName]string caller = null)
        {
            if (caller == null)
                throw new ArgumentNullException(nameof(caller));

            if (_invokeHandler == null)
            {
                throw new InvalidOperationException("InvokeHandler has not been set.");
            }

            _invokeHandler.Invoke(caller, args);
        }
    }
}
