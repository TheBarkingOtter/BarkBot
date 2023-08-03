const { commands } = require("./commands/thebarkingotter.js");
const inquirer = require("inquirer");
//const twitchBot = require("./twitch_bot.js");

inquirer.registerPrompt("input-up", require("inquirer-input-up"));

var helpMap =
{
	help : "lists commands",
	exit : "shuts down the bot",
	chat : "sends a custom chat message through the bot",
	command : "invisibly executes a chat command (does not appear in twitch chat)"
};

var customCommands = [];
var botFunctions = {};
var lastCommandArgs = [];

/////////////////////////////////////////////////////
// Injects custom commands. Commands are expected in
// the form name : array, where the array should
// be the answers any followup prompts from the
// console.
/////////////////////////////////////////////////////
function SetCustomCommands(commandMap)
{
	customCommands = commandMap;
}

function GetNextArgument()
{
	if(lastCommandArgs == null || lastCommandArgs.length == 0)
		return null;
	else
		return lastCommandArgs.shift();
}

function GetRemainingArguments()
{
	return lastCommandArgs.join(' ');
}

/////////////////////////////////////////////////////
// Runs the console interactivity loop.
/////////////////////////////////////////////////////
async function Run(_functionMap)
{
	botFunctions = _functionMap;
	
	var questions =
	[
		{
			type : "input",
			name : "command",
			message : "Begin entering commands. Enter 'help' for a list of commands."
		}
	];
	
	var promise = null;
	var quit = false;
	
	while(!promise)
	{
		var command = "";
		
		// In order to use inquirer correctly, without any issues of overlapping inquirer-ing.
		// i.e. to ensure that the questions wait correctly for you to answer them before asking again / asking the next question.
		// 1. store the promise from "then" in a variable.
		// 2. await that promise
		
		promise = inquirer.prompt(questions).then((answers) =>
		{
			lastCommandArgs = answers.command.split(' ');
			command = GetNextArgument();	
			promise = null;
		});
		
		await promise;

		for(var key in customCommands)
		{
			if(command == key)
			{
				lastCommandArgs = customCommands[key].split(' ');
				command = GetNextArgument();
			}
		}

		if(command.charAt(0) == '!')
		{
			console.log(command);
			lastCommandArgs.unshift("command", botFunctions.GetClient().getOptions().channels[0], command);
			command = GetNextArgument();
		}
		
		switch(command)
		{
			case "help":
				Help();
				break;
			case "exit":
				Exit();
				quit = true;
				break;
			case "chat":
				await Chat();
				break;
			case "command":
				await Command();
				break;
		}
		
		if(quit)
			return;
	}
	
}

/////////////////////////////////////////////////////
// Lists commands.
/////////////////////////////////////////////////////
function Help()
{
	for(var command in helpMap)
	{
		console.log(command + ": " + helpMap[command]);
	}
}

function Exit()
{
	botFunctions.Disconnect();
}

async function Chat()
{
	var questions = [];
	var channel = GetNextArgument();
	if(channel = null)
		questions.push({
			type : "input-up",
			name : "channel",
			message : "Enter channel"
		});

	var chatMessage = GetRemainingArguments();
	if(chatMessage == null || chatMessage == null)
		questions.push({
			type : "input",
			name : "chatMessage",
			message : "Enter message"
		});

	if(questions.length == 0)
		botFunctions.Say(channel, chatMessage);
	else
	{
		var promise = inquirer.prompt(questions).then((answers) =>
		{
			botFunctions.Say(answers.channel, answers.chatMessage);
		});
	
		await promise;
	}
}

async function Command()
{
	var questions = [];
	var channel = GetNextArgument();
	if(channel == null)
		questions.push({
			type : "input",
			name : "channel",
			message : "Enter channel"
		});

	var command = GetRemainingArguments();
	if(command == null || command == "")
		questions.push({
			type : "input",
			name : "command",
			message : "Enter message"
		});

	// Send messages as a mod user
	var user = { badges: { moderator: '1' } };

	if(questions.length == 0)
		botFunctions.ParseCommand(channel, command, user);
	else
	{
		var promise = inquirer.prompt(questions).then((answers) =>
		{
			botFunctions.ParseCommand(answers["channel"], answers["command"], user);
		});
		
		await promise;
	}
}

// Expose public functions.
module.exports = { SetCustomCommands, Run };