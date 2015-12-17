using System;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Base class for <see cref="IJavaScriptModule"/>s.
    /// </summary>
    public abstract class JavaScriptModuleBase : IJavaScriptModule
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
        /// Invoke a method by name.
        /// </summary>
        /// <param name="name">The name of the method.</param>
        /// <param name="args">The arguments.</param>
        /// <remarks>
        /// The expectation is that <see cref="IJavaScriptModule"/>s will use
        /// this method to notify the framework of a JavaScript call to be
        /// executed. This is to overcome the absense of a performant "proxy"
        /// implementation in the .NET framework.
        /// </remarks>
        protected void Invoke(string name, params object[] args)
        {
            if (_invokeHandler == null)
            {
                throw new InvalidOperationException("InvokeHandler has not been set.");
            }

            _invokeHandler.Invoke(name, args);
        }
    }
}
