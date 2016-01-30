using Windows.UI.Text;

namespace ReactNative.Views.Text
{
    static class FontStyleHelpers
    {
        public static FontWeight? ParseFontWeight(string fontWeightString)
        {
            var fontWeightNumeric = fontWeightString != null
                ? ParseNumericFontWeight(fontWeightString)
                : -1;

            if (fontWeightNumeric >= 500 || fontWeightString == "bold")
            {
                return FontWeights.Bold;
            }
            else if (fontWeightString == "normal" || (fontWeightNumeric != -1 && fontWeightNumeric < 500))
            {
                return FontWeights.Normal;
            }

            return null;
        }

        public static FontStyle? ParseFontStyle(string fontStyleString)
        {
            switch (fontStyleString)
            {
                case "italic":
                    return FontStyle.Italic;
                case "normal":
                    return FontStyle.Normal;
                default:
                    return null;
            }
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
