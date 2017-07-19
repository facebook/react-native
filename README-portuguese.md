# React Native [![Build Status](https://travis-ci.org/facebook/react-native.svg?branch=master)](https://travis-ci.org/facebook/react-native) [![Circle CI](https://circleci.com/gh/facebook/react-native.svg?style=shield)](https://circleci.com/gh/facebook/react-native) [![npm version](https://badge.fury.io/js/react-native.svg)](https://badge.fury.io/js/react-native)

React Native permite você a crie experiências de plataformas nativas usando uma experiência de desenvolvimento consistente baseado no JavaScript e [React](https://facebook.github.io/react). O foco do React Native é desenvolver de forma eficiente para todas as plataformas que você deseja - aprenda uma vez, escreva em qualquer lugar. Facebook usa o React Native na produção de multiplos aplicativos e irá continuar investindo no React Native.

Suporta operações em sistemas >= Android 4.1 (API 16) e >= iOS 8.0. 
 
- [Iniciando](#iniciando)
- [Conseguindo ajuda](#conseguindo-ajuda)
- [Documentação](#documentação)
- [Exemplos](#examplo)
- [Ampliando o React Native](#ampliando-o-react-native)
- [Atualizando](#atualizando)
- [Abrindo Issues](#abrindo-issues)
- [Contribuindo](#contribuindo)
- [Licença](#licença)

## Introdução

Veja o [React Native website](https://facebook.github.io/react-native/) oficial para uma introdução ao React Native.

## Iniciando

- Siga o [guia de inicialização](https://facebook.github.io/react-native/docs/getting-started.html) para instalar o React Native e suas dependências.
- [Abra o aplicativo RNTester](#examples) para ver uma lista completa dos componentes que  são prontos pra uso com o React Native.
- Instale a ferramenta para desenvolvedor React no [Chrome](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) ou [Firefox](https://addons.mozilla.org/firefox/addon/react-devtools/) para um debug melhor [(leia mais)](https://facebook.github.io/react-native/docs/debugging.html).
- Teste outros aplicativos do [Portifólio](https://facebook.github.io/react-native/showcase.html) para ver o que o React Native é capaz de fazer.

## Conseguindo ajuda

Por favor use os recursos da comunidade para conseguir ajuda. Nós usamos as issues do GitHub para rastrear bugs e solicitações de features e temos um limite de banda para encontra-los.

- Faça uma pergunta no [StackOverflow](https://stackoverflow.com/) e use a tag `react-native`
- Converse no chat conosco no [Reactiflux](https://discord.gg/0ZcbPKXt5bWJVmUY) em #react-native.
- Articule suas solicitações de features ou realize a votação em uma existente no [Canny](https://react-native.canny.io/feature-requests)
- Inicie uma thread de discussão no [Board de Discurssões React](https://discuss.reactjs.org/)
- Junte-se ao #reactnative no IRC: chat.freenode.net
- Se você tiver encontrado algum bug, por favor [Abra uma issue](#opening-issues)

## Documentação

[A Documentação do website](https://facebook.github.io/react-native/docs/) é dividida em multiplas seções.

- Lá existem **Guias** dos tópicos de discussão tipo [debugando o código](https://facebook.github.io/react-native/docs/debugging.html), [Interação com um aplicativo existente](https://facebook.github.io/react-native/docs/integration-with-existing-apps.html), e [o sistema de resposta do sinal](https://facebook.github.io/react-native/docs/gesture-responder-system.html).
- A seção dos **Components** cobre os componentes do React como as [`View`](https://facebook.github.io/react-native/docs/view.html) e os [`Button`](https://facebook.github.io/react-native/docs/button.html).
- A seção de **APIs** cobre outras bibliotecas como [Animações](https://facebook.github.io/react-native/docs/animated.html) e [StyleSheet](https://facebook.github.io/react-native/docs/stylesheet.html)  que não são realmente componentes do React
- Finalmente, o React Native providencia um pequeno número de **Polyfills** que são semelhantes a da web.

Outra grande coisa a se aprender são sobre os componentes e APIs inclusas com o React Native é só ler o seu código fonte. Dê uma olhada no diretório `Libraries/Components` para ver sobre os componentes, tipo `ScrollView` e `TextInput`, por exemplo. O exemplo do RNTester também é uma demostração de várias maneiras para se usar esses componentes. A partir do código você pode ter uma melhor compreensão sobre cada componente e sobre as APIs.

A documentação do React Native é somente para discução sobre os componentes, APIs e tópicos especificos do React Native (React no iOS e no Android). Para obter a documentação da API do React, que é compartilhada entre a do React Native e React DOM, referencie-se a [Documentação React](https://facebook.github.io/react/).


## Exemplo

- `git clone https://github.com/facebook/react-native.git`
- `cd react-native && npm install`

### Rodando o aplicativo RNTester no seu iOS

Agora abra o `RNTester/RNTester.xcodeproj` e rode no seu Xcode.

### Rodando no aplicativo RNTester no seu Android

Note que você precisa das Android SDK instaladas, veja [pré-requisitos](https://github.com/facebook/react-native/blob/master/ReactAndroid/README.md#prerequisites).

```bash
./gradlew :RNTester:android:app:installDebug
# Inicie um pacote no shell separado (tenha certeza que você rodou o comando npm install):
./scripts/packager.sh
```
## Ampliando o React Native

- Procurando por um componente? [JS.coach](https://js.coach/react-native)
- Acompanhe desenvolvedores que escrevem e publicam modulos React Native para NPM e open source no GitHub.
- Faça modulos para ajudar o ecossistema e a comunidade React Natice a crescerem. Nós recomendamos que os módulos sejam escritos por você para os seus caso e sejam compartilhados via NPM.
- Leia o guia de módulos nativos ([iOS](https://facebook.github.io/react-native/docs/native-modules-ios.html), [Android](https://facebook.github.io/react-native/docs/native-modules-android.html)) e componentes Native UI ([iOS](https://facebook.github.io/react-native/docs/native-components-ios.html), [Android](https://facebook.github.io/react-native/docs/native-components-android.html)) se você está interessado em extender as funções nativas.

## Atualizando

React Native é um desenvolvimento ativo, Veja o guia no [atualizando o React Native](https://facebook.github.io/react-native/docs/upgrading.html) para continuar deixando o seu projeto atualizado.

## Abrindo Issues

Se você encontrar algum bug no React Native nós gostariamos de ouvir sobre. Procure as [issues existentes](https://github.com/facebook/react-native/issues) e procure ter certeza se o seu problema já não foi relatado antes de abrir uma nova issue. É útil você incluir a última versão do React Native e do sistema operacional que esteja usando. Por favor inclua uma forma de identificar e reproduzir o caso quando for apropriado.

As issues do GitHub são para reportar bug e novas solicitações de features. Para ajuda e outras questões sobre como usar o React Native tenha certeza se está listada na seção [Conseguindo Ajuda](#getting-help). em particular o [Canny](https://react-native.canny.io/feature-requests) é uma boa maneira de sinalizar o seu interese em uma feature ou issue. Existem alguns recursos disponiveis para manipulação de issues e manutenção das issues abertas nós podemos responder de forma rápida com o suporte.

## Contribuindo

Para mais informações de como contribuir com Pull Requests e issues, veja nosso [Guia de Contribuição](https://github.com/facebook/react-native/blob/master/CONTRIBUTING.md).

[Boa primeira tarefa](https://github.com/facebook/react-native/labels/Good%20First%20Task) é uma ótima maneira de iniciar os pontos de PRs.

Nós encorajamos a comunidade a perguntar e responder questões no Stack Overflow com [a tag react-native](https://stackoverflow.com/questions/tagged/react-native). É uma ótima maneira de ajudar a comunidade e se envolver.

## Licença

React tem [código de licença aberto](./LICENSE). Nós também providenciamos e anexamos [concessão de patentes](./PATENTS).

Documentação do React é [Creative Commons licenciada](./LICENSE-docs).

Exemplos fornecidos nesse repositório e a documentação estão [licenciados separadamente](./LICENSE-examples), assim como alguns [componentes customizados](./LICENSE-CustomComponents).
