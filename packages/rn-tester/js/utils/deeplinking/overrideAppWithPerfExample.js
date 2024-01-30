import { FlatListExample } from '../../components/perftesting/FlatListExample';
import React from 'react';
import { Linking } from 'react-native';

const useHandleInitialUrl = () => {
  const [{
    initialURL,
    loadingInitialURL,
  }, setState] = React.useState({
    loadingInitialURL: true,
    initialURL: null,
  });

  React.useEffect(() => {
    const getUrlAndSetInitialURL = async () => {
      const url = await Linking.getInitialURL();
      setState({
        initialURL: url,
        loadingInitialURL: false,
      });
    };

    getUrlAndSetInitialURL().catch(error => {
      console.error(error);
      setState({
        initialURL: null,
        loadingInitialURL: false,
      });
    });
  }, []);

  return {initialURL, loadingInitialURL};
};

/**
 * For performance testing, we completely override the app with the perf component
 *
 * The reason is to make sure we test the performance of RN and not of RN Tester
 * as in, if we make changes to RN Tester, we don't want it to impact the perf results
 */
export const overrideAppWithPerfExample = (App: React.AbstractComponent<AppProps>) => (props: AppProps): React.Node => {
  const {initialURL, loadingInitialURL} = useHandleInitialUrl();

  if (loadingInitialURL) {
    return null;
  }

  if (initialURL === 'rntester://example/perftesting/flatlistexample') {
    return <FlatListExample />;
  }

  return <App {...props} />;
};
