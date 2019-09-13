document.addEventListener('DOMContentLoaded', function() {
  const container = document.querySelector('.container.mainContainer .wrapper');
  if (container) {
    const div = document.createElement('div');
    div.innerHTML =
      '<a class="callout_docs-survey-2019-2" href="https://www.surveymonkey.co.uk/r/PCFLG7B"><svg height="100px" width="100px"  fill="#000000" xmlns="http://www.w3.org/2000/svg" data-name="Layer 1" viewBox="0 0 100 100" x="0px" y="0px"><title>89all</title><path d="M80.17,11.5H69.11a11.13,11.13,0,0,0-3.6-7.12l0,0A11.09,11.09,0,0,0,58.05,1.5H41.95a11.09,11.09,0,0,0-7.43,2.85l0,0a11.13,11.13,0,0,0-3.6,7.13H19.83a9,9,0,0,0-9,9v69a9,9,0,0,0,9,9H80.17a9,9,0,0,0,9-9v-69A9,9,0,0,0,80.17,11.5ZM71.48,63.4H60.2a6,6,0,0,0-6,6V81.64H28.52V26.36h2.31v.14a3,3,0,0,0,3,3H66.17a3,3,0,0,0,3-3v-.14h2.31ZM68,69.4l-7.85,8v-8ZM36.83,12.61a5.12,5.12,0,0,1,1.69-3.8l0,0a5.1,5.1,0,0,1,3.4-1.3H58.05a5.1,5.1,0,0,1,3.4,1.3l0,0a5.12,5.12,0,0,1,1.69,3.8V23.5H36.83ZM83.17,89.5a3,3,0,0,1-3,3H19.83a3,3,0,0,1-3-3v-69a3,3,0,0,1,3-3h11v2.86H28.52a6,6,0,0,0-6,6V81.64a6,6,0,0,0,6,6H58.58l18.9-19.29v-42a6,6,0,0,0-6-6H69.17V17.5h11a3,3,0,0,1,3,3Z"></path><path d="M36.28,45H47.9a3,3,0,1,0,0-6H36.28a3,3,0,0,0,0,6Z"></path><path d="M62.9,51H36.28a3,3,0,0,0,0,6H62.9a3,3,0,1,0,0-6Z"></path></svg>Have two minutes to help us make the React Native docs even better? <span>Take our short survey!</span></a>';
    const content = div.childNodes[0];
    container.insertBefore(content, container.childNodes[0]);
  }
});
