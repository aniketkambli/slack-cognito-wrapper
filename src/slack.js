const axios = require('axios');
const {
  SLACK_CLIENT_ID,
  SLACK_CLIENT_SECRET,
} = require('./config');
const logger = require('./connectors/logger');

const getApiEndpoints = () => ({
  userDetails: `https://slack.com/api/users.info`,
  oauthToken: `https://slack.com/api/oauth.v2.access`,
  oauthAuthorize: `https://slack.com/oauth/v2/authorize`
});

const check = response => {
  console.log('check response',response);
  logger.debug('Checking response: %j', response, {});
  if (response.data) {
    if (response.data.error) {
      throw new Error(
        `Slack API responded with a failure1: ${response.data.error}, ${
          response.data.error_description
        }`
      );
    } else if (response.status === 200) {
      return response.data;
    }
  }
  throw new Error(
    `Slack API responded with a failure2: ${response.status} (${
      response.statusText
    })`
  );
};

const slackGet = async (url, accessToken,user_id) =>{
  console.log('Inside slack get');
  const res= await axios({
    method: 'POST',
    url,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    params: {
      user: user_id
    }
  });
  return res;
}


module.exports = (apiBaseUrl, loginBaseUrl) => {
  const urls = getApiEndpoints(apiBaseUrl, loginBaseUrl || apiBaseUrl);
  return {
    getAuthorizeUrl: (client_id, scope, state, response_type) => {
      scope.split('openid').join('');
      return `${
        urls.oauthAuthorize
      }?client_id=${client_id}&scope=${encodeURIComponent(
        scope
      )}&state=${state}&response_type=${response_type}`;
    },
    getUserDetails: (accessToken,user_id) =>
      slackGet(urls.userDetails, accessToken,user_id).then(check).catch(e=>console.log('slack 63',e)),
    getToken: (code) => {
      console.log('inside get token code',code);
      const data = {
        // OAuth required fields
        client_id: SLACK_CLIENT_ID,
        // Slack Specific
        client_secret: SLACK_CLIENT_SECRET,
        code,
      };
      console.log('inside get token',data);
      console.log(
        'Getting token from %s with data: %j',
        urls.oauthToken,
        data,
      );
      return axios({
        method: 'GET',
        url: urls.oauthToken,
        params: data,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      }).then(check);
    }
  };
};
