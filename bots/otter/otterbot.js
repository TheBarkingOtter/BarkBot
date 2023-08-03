let modules =
{
	twitchBot : require('./../../modules/twitch_bot.js')
};

//HACK: couldn't figure out how to dynamically determine the path of this js file
//const BOT_PATH = 'C:/Users/Scott/Documents/GitHub/BarkBot/bots/otter';

var configMap = modules.twitchBot.ParseConfig('./config.txt');
let configModules = configMap.modules;


//TODO: Make this configurable.
//- config file has an array of modules (testing this with configModules object)
//- parse config into map object
//- check the module array within the config object
//- for each entry in the module array...
for(let mod in configModules)
{
//	- add "./../../modules/" to the beginning of every path
	let path = configModules[mod];
	path = "./../../modules/" + path;

//	- require it
	modules[mod] = require(path);

//	- parse it to see if it has a commands property exported
	if(modules[mod].hasOwnProperty("commands"))
	{
		// - call twitchBot.AddCommands() on it
		modules.twitchBot.AddCommands(modules[mod].commands);
	}


}

//const secure = require("./../../modules/secure.js");

//const channel = require('./../../modules/commands/thebarkingotter.js');
const generic = require('./../../modules/commands/dice.js');
const raidCommand = require('./../../modules/commands/raid.js');

//const htmlInteract = require("../../modules/commands/html_interact.js")
const overlay = require("../../modules/commands/overlays/overlay.js");
const goals = require("../../modules/commands/overlays/goals.js")
const credits = require('./../../modules/commands/overlays/credits.js');
const counters = require('./../../modules/commands/overlays/counters.js');
const twitchApi = require("./../../modules/commands/overlays/twitchAPI.js");
//const emoteWall = require("./../../modules/commands/overlays/emoteWall.js");

const points = require('./../../modules/commands/points.js')
const viewers = require("./../../modules/commands/viewers.js");

const chatterList = require('./../../modules/chatter_list.js');
const logFile = require("./../../modules/log_file.js");
const commandTracking = require("./../../modules/commands/commandTracking")
const shoost = require("./../../modules/commands/overlays/shoost.js")

const botConsole = require('./../../modules/twitch_bot_console.js');

let overlaysPath = configMap.overlaysPath;


main();

function main()
{
	try
	{
		//var configMap = modules.twitchBot.ParseConfig(BOT_PATH + 'config.txt');
	
		//TODO: can we determine which modules have commands and add them to a list,
		// then run a loop on the list to add them

		modules.twitchBot.AddCommands(generic.commands);
		
		modules.twitchBot.AddCommands(raidCommand.commands);

		//twitchBot.AddCommands(htmlInteract.commands);
		modules.twitchBot.AddCommands(overlay.commands);
		modules.twitchBot.AddCommands(goals.commands);
		modules.twitchBot.AddCommands(counters.commands);
		modules.twitchBot.AddCommands(twitchApi.commands);

		modules.twitchBot.AddCommands(points.commands);
		modules.twitchBot.AddCommands(viewers.commands);
		modules.twitchBot.AddCommands(credits.commands);
		modules.twitchBot.AddCommands(shoost.commands);
	
		botConsole.SetCustomCommands(configMap.consoleCommands);
		
		var client = modules.twitchBot.CreateClient(
			configMap.identities.SelfIdentity,
			['thebarkingotter']
		);
		
		twitchApi.Initialize(configMap.clientId, configMap.token);
		overlay.Initialize(overlaysPath + "overlay.json");
		chatterList.Initialize(modules.twitchBot, overlaysPath + "Userlists");
		logFile.Initialize(modules.twitchBot, overlaysPath + "Logs");
		goals.Initialize(modules.twitchBot);
		points.Initialize(modules.twitchBot, overlaysPath);
		//emoteWall.Initialize(modules.twitchBot);
		commandTracking.Initialize(modules.twitchBot, overlaysPath + "commandRecord_");
		//viewers.InitializeViewerLogging(twitchBot);
		
		
		modules.twitchBot.ConnectAndRun();
	}
	catch(e)	// catch an exception if it occurs
	{
		console.log(e);
	}
	
}