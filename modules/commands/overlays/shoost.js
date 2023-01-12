const jsonUtility = require("./../../json_utility");
const overlay = require("./overlay.js");
const twitchBot = require("./../../../modules/twitch_bot.js");
const { commands } = require("../thebarkingotter.js");
const { CreateJsonPath } = require("./overlay.js");

//////////////////////////////////////////////////////////////////////
//
//////////////////////////////////////////////////////////////////////
function JoinGame(command)
{
    let user = jsonUtility.SanitizeUsername(command.senderState.username);

    overlay.ReadData();
    overlay.CreateJsonPath("shoost");
    let data = overlay.GetData();
    console.log(data);

    // if this is the first time the command is used...
    if(!data.shoost.hasOwnProperty("nextGame"))
    {
        console.log("nextGame was not found");
        data.shoost.nextGame = [user];
    }
    else
    {
        // in typical cases we already have an array so we just push
        let index = data.shoost.nextGame.indexOf(user);
        if(index == -1)
        {
            data.shoost.nextGame.push(user);
            console.log(user + " is joining Shoost!");
        }
        else
        {
            console.log(user + " is already in the queue for Shoost!")
        }
    }

    data.shoost.timeStamp = Date.now();
    overlay.WriteData();
}

module.exports =
{
    commands:
    {
        "!shoost" : JoinGame
    }
};