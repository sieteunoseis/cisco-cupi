const fetch = require("fetch-retry")(global.fetch);
const url = require("url");
const parseString = require("xml2js").parseString;
const stripPrefix = require("xml2js").processors.stripPrefix;

function removeExtraSlashes(urlString) {
  const parsedUrl = new url.URL(urlString);

  // Remove extra slashes in the pathname (excluding the protocol and domain)
  parsedUrl.pathname = parsedUrl.pathname.replace(/\/{2,}/g, "/");

  // Reconstruct the URL
  return parsedUrl.toString();
}

class cupiService {
  constructor(host, username, password, retry = true) {
    this._OPTIONS = {
      retryOn: async function (attempt, error, response) {
        if (!retry) {
          return false;
        }
        if (attempt > 3) {
          return false;
        }
        // retry on any network error, or 4xx or 5xx status codes
        if (error !== null || response.status >= 400) {
          const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
          await delay(3000);
          return true;
        }
      },
      method: "",
      headers: {
        Authorization: username && password ? "Basic " + Buffer.from(username + ":" + password).toString("base64") : "",
        "Content-Type": "",
        Connection: "Keep-Alive",
      }
    };
    this._HOST = host;
  }
  async cupiRequest(url, method, contentType, data) {
    try {
      let options = this._OPTIONS;
      options.method = method;
      options.headers["Content-Type"] = contentType;
      options.body = data ? data : null;
      let host = this._HOST;
      let cleanedUrl = removeExtraSlashes(`https://${host}/${url}`);
      const response = await fetch(cleanedUrl, options);
      if (!response.ok) {
        throw { status: response.status, statusText: response.statusText };
      }
      let returnData = await response.text();

      // If the response is 201, return non parsed data
      if(response.status === 201){
        return returnData
      }else{
        let output = await parseXml(returnData);
        if(!output){
          return response.status
        }
        // Remove unnecessary keys
        removeKeys(output, "$");
  
        return output;
      }
    } catch (error) {
      throw error;
    }
  }
}

const parseXml = (xmlPart) => {
  return new Promise((resolve, reject) => {
    parseString(
      xmlPart,
      {
        explicitArray: false,
        explicitRoot: false,
        tagNameProcessors: [stripPrefix],
      },
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
};

/**
 * Remove all specified keys from an object, no matter how deep they are.
 * The removal is done in place, so run it on a copy if you don't want to modify the original object.
 * This function has no limit so circular objects will probably crash the browser
 *
 * @param obj The object from where you want to remove the keys
 * @param keys An array of property names (strings) to remove
 */
const removeKeys = (obj, keys) => {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      switch (typeof obj[prop]) {
        case "object":
          if (keys.indexOf(prop) > -1) {
            delete obj[prop];
          } else {
            removeKeys(obj[prop], keys);
          }
          break;
        default:
          if (keys.indexOf(prop) > -1) {
            delete obj[prop];
          }
          break;
      }
    }
  }
};

module.exports = cupiService;
