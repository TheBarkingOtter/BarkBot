const filesystem = require("fs");
const html_interact = require("./../html_interact.js")
const overlay = require("./overlay.js")
const twitchBot = require("./../../../modules/twitch_bot.js");
const { html } = require("cheerio/lib/api/manipulation");
const { data } = require("cheerio/lib/api/attributes");

const ACCESS_TOKEN = '?';
const CLIENT_ID = '?';
const TWITCH_API_URL = "https://www.thebarkingotter.com/gameworks/twitchAPI.php";

var bot = null;

function Initialize(_bot)
{
    //TODO: defensive

    overlay.ReadData();
    bot = _bot;

    bot.GetClient().on('message', OnChatMessage);
}

function OnChatMessage(channel, user, message, sentBySelf)
{
    overlay.ReadData();
    var data = overlay.GetData();
    data.emoteWall.time = Date.now();
    data.emoteWall.message = message;
    overlay.WriteData();
}

module.exports=
{
    Initialize
}