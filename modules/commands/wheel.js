const filesystem = require("fs");
const jsonUtility = require("../json_utility.js");
const twitchBot = require("../twitch_bot.js");

function Initialize(bot)
{

}

function GetRandomElement(array)
{
    var randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function DrawWheel()
{
    
}

module.exports = { GetRandomElement };