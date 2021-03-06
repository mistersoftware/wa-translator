const AssistantV2 = require('ibm-watson/assistant/v2');
const { IamAuthenticator } = require('ibm-watson/auth');
const LanguageTranslatorV3 = require('ibm-watson/language-translator/v3');

function main(params) {

  // Watson Assistant (WA) credentials
  let wa_apikey = "{your-watson-assisatant-api-key}";
  let wa_url = "{watson-assistant-url}";
  let wa_version = "{watson-assistant-version}";
  let assistantId = "{assistant-id-to-translate}";

  // Language Translator (LT) credentials
  let lt_apikey = "{your-language-translator-api-key}";
  let lt_url = "{language-translator-url}";
  let lt_version = "{language-translator-version}";

  // variables for debugging
  let originalInput = "";
  let translatedInput = "";
  let originalOutput = "";
  let translatedOutput = "";

  // instantiates LT and WA authenticators and objects
  const authenticatorWA = new IamAuthenticator({ apikey: wa_apikey });
  const authenticatorLT = new IamAuthenticator({ apikey: lt_apikey });

  const assistant = new AssistantV2({
    version: wa_version,
    authenticator: authenticatorWA,
    url: wa_url,
  });

  const languageTranslator = new LanguageTranslatorV3({
    version: lt_version,
    authenticator: authenticatorLT,
    url: lt_url,
  });

  let session_id = "";

  // assign variables from input parameters, passed from Watson Assistant
  session_id = params.session_id; // ? params.session_id : '';
  userUtter = params.user_utterance;
  originalInput = userUtter;
  language = params.language;

  // LT parameters
  const translateParams = {
    text: userUtter,
    source: language,
    target: "en",
  };

  return new Promise((resolve, reject) => {

    assistant.createSession({
      assistantId: assistantId
    }).then(res => {
        session_id = res.result.session_id;

       return languageTranslator.translate(translateParams);
    }).then(function (translationResult) {

    // if no session ID needs to be created
    // languageTranslator.translate(translateParams).then(function (translationResult) {

      // receive english translation from LT service
      let englishTransl = translationResult.result.translations[0].translation;
      console.log("English input: ", englishTransl);
      translatedInput = englishTransl;

      // send english translated input to WA
      return assistant.message({
        assistantId: assistantId,
        sessionId: session_id,
        input: {
          'message_type': 'text',
          'text': englishTransl
        }
      });
    }).then(function (res) {;
      // receive english translated response from WA
      let englishResp = res.result.output.generic[0].text;
      console.log("English output: ", englishResp);
      originalOutput = englishResp;

      // parameters for converting response to user language
      const translateParams = {
        text: res.result.output.generic[0].text,
        source: "en",
        target: language,
      };

      return languageTranslator.translate(translateParams);

    }).then(function (translationResult) {
      // receive bot response in user language
      console.log("Output translation: ", translationResult.result.translations[0].translation);
      translatedOutput = translationResult;

      // return only the translated message
      // return{"message":translationResult.result.translations[0].translation};

      // returns translations at each step to the chatbot
      resolve({ "message": translationResult.result.translations[0].translation, "originalInput": originalInput, "translatedInput": translatedInput, "originalOutput": originalOutput, "translatedOutput": translatedOutput });
    }).catch(function (err) {

      // if an error occurs, return the error
      reject({ "error": err });
      console.log("****error: ", err);
    });
  })
}

exports.main = main;

// This is for local testing
// main({session_id: "", user_utterance: "¿Que puedes hacer?", language: "es"});
