const TwitchBot = require("../twitch_bot.js");

let bot = null;

///////////////////////////////////////////////////////////
// Initializes listening.
///////////////////////////////////////////////////////////
function Initialize(_bot)
{
    bot = _bot;
	if(bot == null || bot.GetClient() == null)
	{
		console.log("unable to initialize anonymous.js: twitch_bot client is null");
		return;
	}

    bot.GetClient().on('whisper', OnWhisper);
}

///////////////////////////////////////////////////////////
// Forwards message to active channel anonymously.
///////////////////////////////////////////////////////////
function OnWhisper(user, state, message, isSelf)
{
    if(isSelf)
        return;

    let channel = bot.GetClient().getOptions().channels[0];

    TwitchBot.ParseCommand(channel, message, state);

    TwitchBot.Say(channel,
        "Anonymous user says: " +
        message);
}


module.exports =
{
	Initialize
};