using Windows.UI.Text;

namespace ReactNative.Views.Text
{
    static class FontStyleHelpers
    {
        public static bool TryParseFontWeightString(string fontWeightString, out FontWeight fontWeight)
        {
            var fontWeightNumeric = fontWeightString != null
                ? ParseNumericFontWeight(fontWeightString)
                : -1;

            fontWeight = default(FontWeight);

            if (fontWeightNumeric >= 500 || fontWeightString == "bold")
            {
                fontWeight = FontWeights.Bold;
                return true;
            }
            else if (fontWeightString == "normal" || (fontWeightNumeric != -1 && fontWeightNumeric < 500))
            {
                fontWeight = FontWeights.Normal;
                return true;
            }

            return false;
        }

        public static bool TryParseFontStyleString(string fontStyleString, out FontStyle fontStyle)
        {
            fontStyle = default(FontStyle);

            switch (fontStyleString)
            {
                case "italic":
                    fontStyle = FontStyle.Italic;
                    break;
                case "normal":
                    fontStyle = FontStyle.Normal;
                    break;
                default:
                    return false;
            }

            return true;
        }

        private static int ParseNumericFontWeight(string fontWeightString)
        {
            return fontWeightString.Length == 3 && fontWeightString.EndsWith("00") &&
                fontWeightString[0] <= '9' && fontWeightString[0] >= '1'
                ? 100 * (fontWeightString[0] - '0')
                : -1;
        }
    }
}
