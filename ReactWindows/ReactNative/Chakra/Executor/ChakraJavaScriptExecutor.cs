using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Diagnostics;

namespace ReactNative.Chakra.Executor
{
    /// <summary>
    /// JavaScript runtime wrapper.
    /// </summary>
    public class ChakraJavaScriptExecutor : IJavaScriptExecutor
    {
        private readonly JavaScriptRuntime _runtime;

        private JavaScriptNativeFunction _consoleInfo;
        private JavaScriptNativeFunction _consoleLog;
        private JavaScriptNativeFunction _consoleWarn;
        private JavaScriptNativeFunction _consoleError;

        private JavaScriptValue _globalObject;
        private JavaScriptValue _requireFunction;

#if !NATIVE_JSON_MARSHALING
        private JavaScriptValue _parseFunction;
        private JavaScriptValue _stringifyFunction;
#endif

        /// <summary>
        /// Instantiates the <see cref="ChakraJavaScriptExecutor"/>.
        /// </summary>
        public ChakraJavaScriptExecutor()
        {
            _runtime = JavaScriptRuntime.Create();
            InitializeChakra();
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
            var globalObject = EnsureGlobalObject();
            var modulePropertyId = JavaScriptPropertyId.FromString(moduleName);
            var module = globalObject.GetProperty(modulePropertyId);

            if (module.ValueType != JavaScriptValueType.Object)
            {
                var requireFunction = EnsureRequireFunction();

                // Get the module
                var moduleString = JavaScriptValue.FromString(moduleName);
                var requireArguments = new[] { globalObject, moduleString };
                module = requireFunction.CallFunction(requireArguments);
            }

            // Get the method
            var methodPropertyId = JavaScriptPropertyId.FromString(methodName);
            var method = module.GetProperty(methodPropertyId);

            // Set up the arguments to pass in
            var callArguments = new JavaScriptValue[arguments.Count + 1];
            callArguments[0] = EnsureGlobalObject(); // TODO: What is first argument?

            for (var i = 0; i < arguments.Count; ++i)
            {
                callArguments[i + 1] = ConvertJson(arguments[i]);
            }

            // Invoke the function
            var result = method.CallFunction(callArguments);

            // Convert the result
            return ConvertJson(result);
        }

        /// <summary>
        /// Runs the given script.
        /// </summary>
        /// <param name="script">The script.</param>
        public void RunScript(string script)
        {
            if (script == null)
                throw new ArgumentNullException(nameof(script));

            try
            {
                JavaScriptContext.RunScript(script);
            }
            catch (JavaScriptScriptException ex)
            {
                var jsonError = JavaScriptValueToJTokenConverter.Convert(ex.Error);
                var message = jsonError.Value<string>("message");
                var stackTrace = jsonError.Value<string>("stack");
                throw new Modules.Core.JavaScriptException(message ?? ex.Message, stackTrace, ex);
            }
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

            var javaScriptValue = ConvertJson(value);
            var propertyId = JavaScriptPropertyId.FromString(propertyName);
            EnsureGlobalObject().SetProperty(propertyId, javaScriptValue, true);
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
            return ConvertJson(EnsureGlobalObject().GetProperty(propertyId));
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
            JavaScriptContext.Current = _runtime.CreateContext();

            var consolePropertyId = default(JavaScriptPropertyId);
            Native.ThrowIfError(
                Native.JsGetPropertyIdFromName("console", out consolePropertyId));

            var consoleObject = JavaScriptValue.CreateObject();
            EnsureGlobalObject().SetProperty(consolePropertyId, consoleObject, true);

            _consoleInfo = ConsoleInfo;
            _consoleLog = ConsoleLog;
            _consoleWarn = ConsoleWarn;
            _consoleError = ConsoleError;

            DefineHostCallback(consoleObject, "info", _consoleInfo);
            DefineHostCallback(consoleObject, "log", _consoleLog);
            DefineHostCallback(consoleObject, "warn", _consoleWarn);
            DefineHostCallback(consoleObject, "error", _consoleError);

            Debug.WriteLine("Chakra initialization successful.");
        }

        #region JSON Marshaling

#if NATIVE_JSON_MARSHALING
        private JavaScriptValue ConvertJson(JToken token)
        {
            return JTokenToJavaScriptValueConverter.Convert(token);
        }

        private JToken ConvertJson(JavaScriptValue value)
        {
            return JavaScriptValueToJTokenConverter.Convert(value);
        }
#else
        private JavaScriptValue ConvertJson(JToken token)
        {
            var parseFunction = EnsureParseFunction();

            var json = token.ToString(Formatting.None);
            var jsonValue = JavaScriptValue.FromString(json);

            return parseFunction.CallFunction(_globalObject, jsonValue);
        }

        private JToken ConvertJson(JavaScriptValue value)
        {
            var stringifyFunction = EnsureStringifyFunction();

            var jsonValue = stringifyFunction.CallFunction(_globalObject, value);
            var json = jsonValue.ToString();

            return JToken.Parse(json);
        }
#endif

        #endregion

        #region Console Callbacks

        private static void DefineHostCallback(
            JavaScriptValue obj,
            string callbackName,
            JavaScriptNativeFunction callback)
        {
            var propertyId = JavaScriptPropertyId.FromString(callbackName);
            var function = JavaScriptValue.CreateFunction(callback);
            obj.SetProperty(propertyId, function, true);
        }

        private JavaScriptValue ConsoleInfo(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            return ConsoleCallback("Info", callee, isConstructCall, arguments, argumentCount, callbackData);
        }

        private JavaScriptValue ConsoleLog(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            return ConsoleCallback("Log", callee, isConstructCall, arguments, argumentCount, callbackData);
        }

        private JavaScriptValue ConsoleWarn(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            return ConsoleCallback("Warn", callee, isConstructCall, arguments, argumentCount, callbackData);
        }

        private JavaScriptValue ConsoleError(
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            return ConsoleCallback("Error", callee, isConstructCall, arguments, argumentCount, callbackData);
        }

        private JavaScriptValue ConsoleCallback(
            string kind,
            JavaScriptValue callee,
            bool isConstructCall,
            JavaScriptValue[] arguments,
            ushort argumentCount,
            IntPtr callbackData)
        {
            try
            {
                Debug.Write($"[JS {kind}]");

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

            return JavaScriptValue.Undefined;
        }

        private string Stringify(JavaScriptValue value)
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
                    return ConvertJson(value).ToString(Formatting.None);
                case JavaScriptValueType.Function:
                case JavaScriptValueType.Error:
                    return value.ConvertToString().ToString();
                default:
                    throw new NotImplementedException();
            }
        }
        #endregion

        #region Global Helpers

        private JavaScriptValue EnsureGlobalObject()
        {
            if (!_globalObject.IsValid)
            {
                _globalObject = JavaScriptValue.GlobalObject;
            }

            return _globalObject;
        }

        private JavaScriptValue EnsureRequireFunction()
        {
            if (!_requireFunction.IsValid)
            {
                var globalObject = EnsureGlobalObject();
                _requireFunction = globalObject.GetProperty(JavaScriptPropertyId.FromString("require"));
            }

            return _requireFunction;
        }

        private JavaScriptValue EnsureParseFunction()
        {
            if (!_parseFunction.IsValid)
            {
                var globalObject = EnsureGlobalObject();
                var jsonObject = globalObject.GetProperty(JavaScriptPropertyId.FromString("JSON"));
                _parseFunction = jsonObject.GetProperty(JavaScriptPropertyId.FromString("parse"));
            }

            return _parseFunction;
        }

        private JavaScriptValue EnsureStringifyFunction()
        {
            if (!_stringifyFunction.IsValid)
            {
                var globalObject = EnsureGlobalObject();
                var jsonObject = globalObject.GetProperty(JavaScriptPropertyId.FromString("JSON"));
                _stringifyFunction = jsonObject.GetProperty(JavaScriptPropertyId.FromString("stringify"));
            }

            return _stringifyFunction;
        }

        #endregion
    }
}
