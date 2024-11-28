const cupiService = require("../main");

var hostname = "hq-cuc-pub.abc.inc";
var username = "administrator";
var password = "password";

(async () => {
  try {
    let service = new cupiService(hostname, username, password, false);
    var results = await service.cupiRequest("/vmrest/handlers/callhandlers", "GET", "application/json", null);
    console.log(results);
  } catch (error) {
    console.error(error);
  }
})();

(async () => {
  try {
    let data = {
      Enabled: "true",
      TimeExpires: "",
    };

    console.log("Can we enable it?");
    let service = new cupiService(hostname, username, password, false);
    var results = await service.cupiRequest("/vmrest/handlers/callhandlers/04cff063-ba3e-4d81-a532-9af617d97149/greetings/Alternate", "PUT", "application/json", data);
    if (results === 204) {
      console.log("Success!");
    }
  } catch (error) {
    console.error(error);
  }
})();
