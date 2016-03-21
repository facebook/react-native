using ReactNative;
using ReactNative.Modules.Core;
using ReactNative.Shell;
using System.Collections.Generic;

namespace Playground
{
    class AppReactPage : ReactPage
    {
        public override string MainComponentName
        {
            get
            {
                return "UIExplorerApp";
            }
        }

        public override string JavaScriptMainModuleName
        {
            get
            {
                return "Examples/UIExplorer/UIExplorerApp.windows";
            }
        }

        public override List<IReactPackage> Packages
        {
            get
            {
                return new List<IReactPackage>
                {
                    new MainReactPackage(),
                };
            }
        }

        public override bool UseDeveloperSupport
        {
            get
            {
                return true;
            }
        }
    }
}
