using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Views.TextInput;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Text;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Tests.Views.TextInput
{
    [TestClass]
    public class ReactTextBoxTests
    {
        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void ReactTextBoxesTests_SuccessfulTextBoxMerge()
        {
            var textBox = new TextBox();
            textBox.Text = "Test Text";

            var reactTextBox = new ReactTextBox() {
                LineHeight = 12,
                Padding = new Thickness(12, 23, 1, 23),
                FontSize = 12,
                FontStyle = FontStyle.Italic
            };

            reactTextBox.MergePropertiesToNativeTextBox(ref textBox);
            Assert.AreEqual(textBox.FontStyle, reactTextBox.FontStyle);
            Assert.AreEqual(textBox.Padding, reactTextBox.Padding);
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void ReactTextBoxesTests_NullTextBoxMerge()
        {
            var textBox = default(TextBox);

            var reactTextBox = new ReactTextBox()
            {
                LineHeight = 12,
                Padding = new Thickness(12, 23, 1, 23),
                FontSize = 12,
                FontStyle = FontStyle.Italic
            };

            reactTextBox.MergePropertiesToNativeTextBox(ref textBox);
            Assert.AreEqual(textBox.FontStyle, reactTextBox.FontStyle);
            Assert.AreEqual(textBox.Padding, reactTextBox.Padding);
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void ReactTextBoxesTests_OverwriteTextBoxMerge()
        {
            var textBox = new TextBox();
            textBox.FontStyle = FontStyle.Normal;

            var reactTextBox = new ReactTextBox()
            {
                LineHeight = 12,
                Padding = new Thickness(12, 23, 1, 23),
                FontSize = 12,
                FontStyle = FontStyle.Italic
            };

            reactTextBox.MergePropertiesToNativeTextBox(ref textBox);
            Assert.AreEqual(textBox.FontStyle, reactTextBox.FontStyle);
        }
    }
}
