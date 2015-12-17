using System;

namespace ReactNative.Bridge
{
    public abstract class JavaScriptModuleBase : IJavaScriptModule
    {
        private IInvokeHandler _invokeHandler;

        public IInvokeHandler InvokeHandler
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
