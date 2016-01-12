using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Views.TextInput;
using ReactNative.UIManager;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Tests.Views.TextInput
{
    [TestClass]
    public class ReactTextBoxPropertiesTests
    {
        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void ReactTextBoxPropertiesTests_SuccessfulSrcControlPropMerge()
        {
            var textBox = new TextBox();
            textBox.Text = "";

            var reactTextBox = new ReactTextBoxProperties() {
                LineHeight = 12,
                Padding = new Thickness(12, 23, 1, 23),
                FontSize = 12,
                FontStyle = FontStyle.Italic
            };

            textBox.SetReactTextBoxProperties(reactTextBox);
            Assert.AreEqual(textBox.FontStyle, reactTextBox.FontStyle);
            Assert.AreEqual(textBox.Padding, reactTextBox.Padding);
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void ReactTextBoxPropertiesTests_NullSrcControlPropMerge()
        {
            var textBox = new TextBox();
            textBox.FontSize = 2;

            var reactTextBox = new ReactTextBoxProperties()
            {
                LineHeight = 12,
                Padding = new Thickness(12, 23, 1, 23),
                FontSize = 12,
                FontStyle = FontStyle.Italic
            };

            textBox.SetReactTextBoxProperties(reactTextBox);
            Assert.AreEqual(textBox.FontStyle, reactTextBox.FontStyle);
            Assert.AreEqual(textBox.Padding, reactTextBox.Padding);
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void ReactTextBoxPropertiesTests_OverwriteControlPropsMerge()
        {
            var textBox = new TextBox();
            textBox.FontStyle = FontStyle.Normal;

            var reactTextBox = new ReactTextBoxProperties()
            {
                LineHeight = 12,
                Padding = new Thickness(12, 23, 1, 23),
                FontSize = 12,
                FontStyle = FontStyle.Italic
            };

            textBox.SetReactTextBoxProperties(reactTextBox);
            Assert.AreEqual(textBox.FontStyle, reactTextBox.FontStyle);
        }
    }
}
