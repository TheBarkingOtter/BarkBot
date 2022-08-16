const jsonUtility = require("./../json_utility");
const logFile = require("./../log_file.js");
const twitchBot = require("./../twitch_bot.js");

let bot = null;
let channel = null;
let filePaths = {};
let dataMap = {};

function Initialize(_bot, pathRoot)
{
    bot = _bot;
    bot.RegisterCommandCallback(OnCommand);  

    let channels = bot.GetClient().getOptions().channels;
    for(let i in channels)
    {
        let channel = jsonUtility.SanitizeChannelName(channels[i]);
        filePaths[channel] = pathRoot + channel + ".txt";
    }

    dataMap = jsonUtility.ReadFiles(filePaths);
}

function OnCommand(command)
{
    channel = jsonUtility.SanitizeChannelName(command.channel);
    let data = dataMap[channel];
    let user = command.senderState.username;
    if(user == null || user == undefined)
        return;
    jsonUtility.EnsureExists(data, user, {});
    let key = command.name + " " + command.arguments.join(" ");
    jsonUtility.EnsureExists(data[user], key, 0);
    ++data[user][key];

    jsonUtility.WriteJsonToFile(data, filePaths[channel], OnCommandLogged);
}

function OnCommandLogged()
{
    logFile.Log(channel, "Command log updated");
}

module.exports = {
    Initialize
};