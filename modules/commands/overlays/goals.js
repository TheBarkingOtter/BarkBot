const filesystem = require("fs");
const overlay = require("./overlay.js")
const twitchBot = require("./../../../modules/twitch_bot.js")

var bot = null;
var numberOfSubs = 0;

function Initialize(_bot)
{
    //TODO: defensive

    overlay.ReadData();
    bot = _bot;

    bot.GetClient().on('subgift', OnSubGift);
	bot.GetClient().on('submysterygift', OnSubMystery);
	bot.GetClient().on('subscription', OnSubscribe);
}


function OnSubGift(channel, username, streak, recipient, methods, user)
{
    //IncrementSubCount(1);
}

function OnSubMystery(channel, username, numSubs, methods, user)
{
	//IncrementSubCount(numSubs);
}

function OnSubscribe(channel, username, methods, message, user)
{
    //IncrementSubCount(1);
}

function IncrementSubCount(amount = 1)
{
    overlay.ReadData();
    var data = overlay.GetData();
    var currentSubs = parseInt(data.ticker.subGoal.current);
    ++currentSubs;
    data.ticker.subGoal.current = currentSubs;
    overlay.WriteData();

    bot.Say(twitchBot.channels[0],
        "bark bark! thanks for the sub! we have now received "
        + currentSubs + " out of 8 subs toward the next giveaway!");
}

module.exports =
{
    commands:
    {
        //"!fakesub" : IncrementSubCount
    },
	Initialize
};