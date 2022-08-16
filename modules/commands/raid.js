const twitchBot = require("../twitch_bot.js");

function Raid(command)
{
    twitchBot.Say(command.channel, "thebar54Heart IT'S A thebar54Bark RAID! thebar54FingerGuns IT'S A thebar54Bark RAID! thebar54Wave");
    twitchBot.Say(command.channel, "IT'S A BARK RAID! IT'S A BARK RAID!");
}

// Expose public methods here
module.exports =
{
	commands:
	{
		"!raid" : Raid
	}
};