const overlay = require("./overlay.js")
const twitchBot = require("./../../../modules/twitch_bot.js")

function EnsureCountersExist(key)
{
    overlay.ReadData();
    let data = overlay.GetData();

    if(data.hasOwnProperty("counters") == false)
    {
        data.counters = {};
        data.counters[key] = 0;
    }

    return data;
}

function ModifyCounter(command, key, defaultCallback, incrementCallback)
{   
    let data = EnsureCountersExist(key);
    if(command.arguments == null|| command.arguments.length == 0)
    {
        defaultCallback();
        return;
    }

    ++data.counters[key];
    overlay.WriteData();

    incrementCallback();
}

function Confus(command)
{
    ModifyCounter(command, "confus",
    function()
    {
        let data = overlay.GetData();
        twitchBot.Say(twitchBot.channels[0],
            "Otter has been confussed by chat " + data.counters.confus + " times");
    },
    function()
    {
        let data = overlay.GetData();
        twitchBot.Say(twitchBot.channels[0],
            "thebar54Confus Otter has now been confussed by chat "
                + data.counters.confus + " times thebar54Confus");

        // Send messages as a mod user
        let user = { badges: { moderator: '1' } };
        twitchBot.ParseCommand(twitchBot.channels[0], "!stampbomb confus", user);
    });
}

function Doot(command)
{
    ModifyCounter(command, "doot",
    function()
    {
        let data = overlay.GetData();
        twitchBot.Say(twitchBot.channels[0],
            "Otter has been caught doot-dooting " + data.counters.doot + " times");
    },
    function()
    {
        let data = overlay.GetData();
        twitchBot.Say(twitchBot.channels[0],
            "thebar54DootDoot Otter has now been caught doot-dooting "
                + data.counters.doot + " times thebar54DootDoot");

        // Send messages as a mod user
        //let user = { badges: { moderator: '1' } };
        //twitchBot.ParseCommand(twitchBot.channels[0], "!stampbomb doot", user);
    });
}

module.exports =
{
    commands:
    {
        "!confus" : Confus,
        "!doot" : Doot
    }
};