const secure = require("./modules/secure.js");
const twitchBot = require('./modules/twitch_bot.js');
const generic = require('./modules/commands/dice.js');
//const channel = require('./modules/commands/crayon.js');
const channel = require('./modules/commands/thebarkingotter.js');

main();

function main()
{
	twitchBot.AddCommands(generic.commands);
	
	twitchBot.AddGreetings(channel.greetings);
	twitchBot.AddCommands(channel.commands);
	
	twitchBot.Initialize(
		secure.BotIdentity,
		['theBarkingOtter']
	);
}