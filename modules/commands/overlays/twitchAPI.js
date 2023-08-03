const axios = require("axios");
const jsonUtility = require("./../../json_utility");
const overlay = require("./overlay.js");
const twitchBot = require("./../../../modules/twitch_bot.js");
const { commands } = require("../thebarkingotter.js");

const GQL_QUERY = "https://thebarkingotter.com/gameworks/twitchGQL.php";

let clientId = "rat7tckwdp2962ahwqlorv2qg4lzcr";
let token = "ptf3ji7tyh1pkyy0am8zuwjyi8ium2";

//TODO: Write token to file with timestamp.
// Check for new token after some time has passed.

function Initialize(_clientId, _token)
{
    clientId = _clientId;
    token = _token;
}

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

///////////////////////////////////////////////////////////////////////////////////
// Sends named query with encoded data. Returns the entire response object.
///////////////////////////////////////////////////////////////////////////////////
async function SendGqlQuery(query, data)
{
    let output = await axios({
        method: 'post',
        url: GQL_QUERY,
        data: {
            accessToken: token,
            clientId: clientId,
            data: data,
            query: query
        },
        //httpsAgent: new https.Agent({ keepAlive: true }),
        maxBodyLength: Number.MAX_SAFE_INTEGER,
        maxContentLength: Number.MAX_SAFE_INTEGER
    });

    return output.data;
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
    let url = "https://twitch.tv/" + sanitizedUsername;

    twitchBot.Say("thebarkingotter", "Go check out " + url + '!!');
    //twitchBot.Say("thebarkingotter", "/shoutout " + username);        // not supported

    command.arguments[0] = sanitizedUsername;
    
        
    SendRequest("shoutout", command);
}

///////////////////////////////////////////////////////////////////////////////////
// Queries the most recent stream date and list of recent games.
// Input is expected as a string, not an array or object.
///////////////////////////////////////////////////////////////////////////////////
async function UpdateRecentStreamData(channelMap)
{
    overlay.ReadData();
    let data = overlay.GetData();

    let queryString = '[';
    let isFirst = true;
    for(let channel in channelMap)
    {
        //TODO: we can do extra processing or culling here
        
        if(!isFirst)
            queryString += ",";

        queryString += '"' + channel + '"';

        isFirst = false;
    }
    queryString += ']';

    let streamData = await SendGqlQuery("recentStreamData", queryString);
    for(let channel in streamData)
    {
        streamData[channel].blurb = channelMap[channel];
    }

    data.recentStreamData = streamData;

    overlay.WriteData();
    return data.recentStreamData;
}

module.exports =
{
    commands:
    {
        "!showclip" : ShowClip,
        "!showpfp" : ShowProfilePic,
        "!so" : Shoutout
    },
    Initialize, UpdateRecentStreamData
};