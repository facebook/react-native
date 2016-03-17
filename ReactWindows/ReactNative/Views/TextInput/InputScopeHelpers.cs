using Windows.UI.Xaml.Input;

namespace ReactNative.Views.TextInput
{
    static class InputScopeHelpers
    {
        public static InputScopeNameValue FromString(string inputScope)
        {
            switch (inputScope)
            {
                case "url":
                    return InputScopeNameValue.Url;
                case "number-pad":
                    return InputScopeNameValue.NumericPin;
                case "phone-pad":
                    return InputScopeNameValue.TelephoneNumber;
                case "name-phone-pad":
                    return InputScopeNameValue.NameOrPhoneNumber;
                case "email-address":
                    return InputScopeNameValue.EmailNameOrAddress;
                case "decimal-pad":
                    return InputScopeNameValue.Digits;
                case "web-search":
                    return InputScopeNameValue.Search;
                case "numeric":
                    return InputScopeNameValue.Number;
                default:
                    return InputScopeNameValue.Default;
            }
        }
    }
}
