const request = require('request'),
  chalk = require('chalk')

const GITHUB_API_URL = 'https://api.github.com/'
const GITHUB_REPOS_URL = GITHUB_API_URL + 'repos/'

const options = {

}
const response = null;

function getOptions() {
  return options
}

function setOptions(userAgent, ghUser, ghRepo, ghIssueState) {
  const url = GITHUB_REPOS_URL + ghUser + '/' + ghRepo + '/issues?state=' + ghIssueState
  //TODO: Validate url
  options.url = url
  options.headers = {
    'User-Agent': userAgent
  }
}

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    var info = JSON.parse(body)
  } else if (error) {
    console.log(chalk.red.bold.inverse("Error code: ") + chalk.red.bold(response.statusCode))
    console.log(chalk.red(error))
  }
}

function getData(userAgent, ghUser, ghRepo, ghIssueState) {
  setOptions(userAgent, ghUser, ghRepo, ghIssueState)

  const req = request(getOptions(), callback)

  let body = ''

  req.on('data', (chunk) => {
    body += chunk
  })

  req.on('end', () => {
    try {
      return JSON.parse(body)
    } catch (error) {
      console.log(chalk.red.bold('Oops! Something went wrong.'))
      return 0
    }
  })
}

module.exports = getData