using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Diagnostics;
#if DEBUG
using Windows.System.Profile;
#endif

namespace ReactNative.Chakra.Executor
{
    /// <summary>
    /// JavaScript runtime wrapper.
    /// </summary>
    public class ChakraJavaScriptExecutor : IJavaScriptExecutor
    {
        private readonly JavaScriptRuntime _runtime;
        private readonly JavaScriptValue _globalObject;

        private JavaScriptSourceContext _sourceContext = JavaScriptSourceContext.None;

        /// <summary>
        /// Instantiates the <see cref="ChakraJavaScriptExecutor"/>.
        /// </summary>
        public ChakraJavaScriptExecutor()
        {
            _runtime = JavaScriptRuntime.Create();
            InitializeChakra();
            _globalObject = JavaScriptValue.GlobalObject;
        }

        /// <summary>
        /// Call the JavaScript method from the given module.
        /// </summary>
        /// <param name="moduleName">The module name.</param>
        /// <param name="methodName">The method name.</param>
        /// <param name="arguments">The arguments.</param>
        /// <returns>The result of the call.</returns>
        public JToken Call(string moduleName, string methodName, JArray arguments)
        {
            if (moduleName == null)
                throw new ArgumentNullException(nameof(moduleName));
            if (methodName == null)
                throw new ArgumentNullException(nameof(methodName));
            if (arguments == null)
                throw new ArgumentNullException(nameof(arguments));

            // Try get global property
            var modulePropertyId = JavaScriptPropertyId.FromString(moduleName);
            var module = _globalObject.GetProperty(modulePropertyId);

            if (module.ValueType != JavaScriptValueType.Object)
            {
                // Get the require function
                var requireId = JavaScriptPropertyId.FromString("require");
                var requireFunction = _globalObject.GetProperty(requireId);

                // Get the module
                var moduleString = JavaScriptValue.FromString(moduleName);
                var requireArguments = new[] { _globalObject, moduleString };
                module = requireFunction.CallFunction(requireArguments);
            }

            // Get the method
            var methodPropertyId = JavaScriptPropertyId.FromString(methodName);
            var method = module.GetProperty(methodPropertyId);

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

        /// <summary>
        /// Runs the given script.
        /// </summary>
        /// <param name="script">The script.</param>
        public void RunScript(string script)
        {
            if (script == null)
                throw new ArgumentNullException(nameof(script));

            JavaScriptContext.RunScript(script);
        }

        /// <summary>
        /// Sets a global variable in the JavaScript runtime.
        /// </summary>
        /// <param name="propertyName">The global variable name.</param>
        /// <param name="value">The value.</param>
        public void SetGlobalVariable(string propertyName, JToken value)
        {
            if (propertyName == null)
                throw new ArgumentNullException(nameof(propertyName));
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            var javaScriptValue = JTokenToJavaScriptValueConverter.Convert(value);
            var propertyId = JavaScriptPropertyId.FromString(propertyName);
            _globalObject.SetProperty(propertyId, javaScriptValue, true);
        }

        /// <summary>
        /// Gets a global variable from the JavaScript runtime.
        /// </summary>
        /// <param name="propertyName">The global variable name.</param>
        /// <returns>The value.</returns>
        public JToken GetGlobalVariable(string propertyName)
        {
            if (propertyName == null)
                throw new ArgumentNullException(nameof(propertyName));

            var propertyId = JavaScriptPropertyId.FromString(propertyName);
            return JavaScriptValueToJTokenConverter.Convert(_globalObject.GetProperty(propertyId));
        }

        /// <summary>
        /// Disposes the <see cref="ChakraJavaScriptExecutor"/> instance.
        /// </summary>
        public void Dispose()
        {
            JavaScriptContext.Current = JavaScriptContext.Invalid;
            _runtime.Dispose();
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
            if (AnalyticsInfo.VersionInfo.DeviceFamily == "Windows.Desktop")
            {
                JavaScriptContext.StartDebugging();
            }
#endif

            var consolePropertyId = default(JavaScriptPropertyId);
            Native.ThrowIfError(
                Native.JsGetPropertyIdFromName("console", out consolePropertyId));

            var consoleObject = JavaScriptValue.CreateObject();
            JavaScriptValue.GlobalObject.SetProperty(consolePropertyId, consoleObject, true);

            DefineHostCallback(consoleObject, "log", ConsoleLog, IntPtr.Zero);
            DefineHostCallback(consoleObject, "warn", ConsoleWarn, IntPtr.Zero);
            DefineHostCallback(consoleObject, "error", ConsoleError, IntPtr.Zero);

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

        #region Console Callbacks

        private static JavaScriptValue ConsoleLog(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            return ConsoleCallback("Log", callee, isConstructCall, arguments, argumentCount, callbackData);
        }

        private static JavaScriptValue ConsoleWarn(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            return ConsoleCallback("Warn", callee, isConstructCall, arguments, argumentCount, callbackData);
        }

        private static JavaScriptValue ConsoleError(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            return ConsoleCallback("Error", callee, isConstructCall, arguments, argumentCount, callbackData);
        }

        private static JavaScriptValue ConsoleCallback(
            string kind,
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            try
            {
                Debug.Write("Chakra " + kind + ">");

                // First argument is this-context, ignore...
                for (var i = 1; i < argumentCount; ++i)
                {
                    Debug.Write(Stringify(arguments[i]) + " ");
                }

                Debug.WriteLine("");
            }
            catch (Exception ex)
            {
                Debug.WriteLine(
                    "Error in ChakraExecutor.ConsoleCallback: " + ex.Message);
            }

            return JavaScriptValue.Invalid;
        }

        private static string Stringify(JavaScriptValue value)
        {
            switch (value.ValueType)
            {
                case JavaScriptValueType.Undefined:
                case JavaScriptValueType.Null:
                case JavaScriptValueType.Number:
                case JavaScriptValueType.String:
                case JavaScriptValueType.Boolean:
                case JavaScriptValueType.Object:
                case JavaScriptValueType.Array:
                    return JavaScriptValueToJTokenConverter.Convert(value).ToString(Formatting.None);
                case JavaScriptValueType.Function:
                    return "function";
                case JavaScriptValueType.Error:
                    return "error";
                default:
                    throw new NotImplementedException();
            }
        }

        #endregion
    }
}
