using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Diagnostics;

namespace ReactNative.Hosting.Bridge
{
    class ChakraJavaScriptExecutor : IJavaScriptExecutor
    {
        private readonly JavaScriptRuntime _runtime;
        private readonly JavaScriptValue _globalObject;
        private readonly JavaScriptValue _requireFunction;

        public ChakraJavaScriptExecutor()
        {
            _runtime = JavaScriptRuntime.Create();
            _globalObject = JavaScriptValue.GlobalObject;
            var requireId = JavaScriptPropertyId.FromString("require");
            _requireFunction = _globalObject.GetProperty(requireId);

            InitializeChakra();

            // TODO: resolve how to inject React JavaScript library
        }

        public JToken Call(string moduleName, string methodName, JArray arguments)
        {
            // Get the module
            var moduleString = JavaScriptValue.FromString(moduleName);
            var requireArguments = new[] { _globalObject, moduleString };
            var module = _requireFunction.CallFunction(requireArguments);

            // Get the method
            var propertyId = JavaScriptPropertyId.FromString(methodName);
            var method = module.GetProperty(propertyId);

            // Set up the arguments to pass in
            var callArguments = new JavaScriptValue[arguments.Count + 1];
            callArguments[0] = _globalObject; // TODO: What is first argument?

            for (var i = 0; i < arguments.Count; ++i)
            {
                callArguments[i + 1] = JTokenToJavaScriptValueConverter.Convert(arguments[i]);
            }

            // Invoke the function
            var result = method.CallFunction(callArguments);

            // Convert the result
            return JavaScriptValueToJTokenConverter.Convert(result);
        }

        public void SetGlobalVariable(string propertyName, JToken value)
        {
            var javaScriptValue = JTokenToJavaScriptValueConverter.Convert(value);
            var propertyId = JavaScriptPropertyId.FromString(propertyName);
            _globalObject.SetProperty(propertyId, javaScriptValue, true);
        }

        private void InitializeChakra()
        {
            // Set the current context
            var context = _runtime.CreateContext();
            JavaScriptContext.Current = context;

            // Set the WinRT namespace (TODO: needed?)
            Native.ThrowIfError(
                Native.JsProjectWinRTNamespace("Windows"));

#if DEBUG
            // Start debugging.
            JavaScriptContext.StartDebugging();
#endif

            var consolePropertyId = default(JavaScriptPropertyId);
            Native.ThrowIfError(
                Native.JsGetPropertyIdFromName("console", out consolePropertyId));

            var consoleObject = JavaScriptValue.CreateObject();
            _globalObject.SetProperty(consolePropertyId, consoleObject, true);

            DefineHostCallback(consoleObject, "log", ConsoleCallback, IntPtr.Zero);
            DefineHostCallback(consoleObject, "warn", ConsoleCallback, IntPtr.Zero);
            DefineHostCallback(consoleObject, "error", ConsoleCallback, IntPtr.Zero);

            Debug.WriteLine("Chakra initialization successful.");
        }

        private static void DefineHostCallback(
            JavaScriptValue obj,
            string callbackName,
            JavaScriptNativeFunction callback,
            IntPtr callbackData)
        {
            var propertyId = JavaScriptPropertyId.FromString(callbackName);
            var function = JavaScriptValue.CreateFunction(callback, callbackData);
            obj.SetProperty(propertyId, function, true);
        }

        private static JavaScriptValue ConsoleCallback(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            try
            {
                Debug.Write("JS console> ");

                // First argument is this-context (? @TODO), ignore...
                foreach (var argument in arguments)
                {
                    Debug.Write(argument.ToString() + " ");
                }

                Debug.WriteLine("");
            }
            catch (Exception ex)
            {
                Debug.WriteLine(
                    "#EXCEPTION in ChakraExecutor::ConsoleCallback()! " + ex.Message);
            }

            return JavaScriptValue.Invalid;
        }

        public void Dispose()
        {
            _runtime.Dispose();
        }
    }
}
