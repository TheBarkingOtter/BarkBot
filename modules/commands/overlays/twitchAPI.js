const jsonUtility = require("./../../json_utility");
const overlay = require("./overlay.js");
const twitchBot = require("./../../../modules/twitch_bot.js");
const { commands } = require("../thebarkingotter.js");

//TODO: Write token to file with timestamp.
// Check for new token after some time has passed.

function SendRequest(query, command)
{
    overlay.ReadData();
    let data = overlay.GetData();

    overlay.CreateJsonPath("twitchAPI");

    let channel = command.arguments[0];
    data.twitchAPI.channel = channel;
    data.twitchAPI.query = query;
    data.twitchAPI.time = Date.now();

    
    let doShowClip = command.arguments[1];
    data.twitchAPI.doShowClip = !(doShowClip == "noclip");

    overlay.WriteData();

    console.log("Invoked " + query + " with the target " + channel);
}

function ShowClip(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    SendRequest("randomClip", command);    
}

function ShowProfilePic(command)
{
    if(!command.SenderIsBroadcasterOrMod())
        return;

    SendRequest("profilePic", command);
}

function Shoutout(command)
{
    if(command.arguments == null || command.arguments.length <= 0)
    {
        twitchBot.Say(twitchBot.channels[0], "I am running a new shoutout command written from scratch! Use a redemption to get a shoutout!");
        return;
    }

    if(!command.SenderIsBroadcasterOrMod())
        return;

    let username = command.arguments[0];
    let sanitizedUsername =  jsonUtility.SanitizeUsername(username);
    let url = "twitch.tv/" + sanitizedUsername;

    twitchBot.Say(twitchBot.channels[0], "Otter recommends " + username
        + " , please be sure to follow and show support at " + url);

    command.arguments[0] = sanitizedUsername;
    
        
    SendRequest("shoutout", command);
}

module.exports =
{
    commands:
    {
        "!showclip" : ShowClip,
        "!showpfp" : ShowProfilePic,
        "!shoutout" : Shoutout
    }
};