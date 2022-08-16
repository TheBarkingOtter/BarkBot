const twitchBot = require("../twitch_bot.js");

var options =
{
	min : 1,
	max : 10000,
	otherSupportedValues : [ 69, 420 ],
	barkOn69 : true
};

/////////////////////////////////////////////////////
// Says a random number in the range [1, n]
/////////////////////////////////////////////////////		!roll 50
function DiceCommand(command)
{
	var size = parseInt(command.arguments[0]);
	if(size == NaN)
		return;
		
	// determine whether zero is supported
	if(0 < options.min && size == 0)
	{
		twitchBot.Say(command.channel, "There's no such thing as a zero-sided die!");
		return;
	}
		
	// allow only sizes that are in options.otherSupportedValues
	/*if(size < options.min || size > options.max)
	{
		var supported = false;
		for(index in options.otherSupportedValues)
		{
			if(size == options.otherSupportedValues[index])
			{
				supported = true;
				break;
			}
		}
		
		if(supported == false)
		{
			twitchBot.Say(command.channel, "Die size unsupported! Limits are " +options.min + " and " + options.max);
			return;
		}
	}*/
	
	const num = Math.floor(Math.random() * size) + 1;
	var message = `/me You rolled a ${num}!`;
	
	if(options.barkOn69 && num == 69)
	{
		message += ' Niiiiice';
	}
	
	twitchBot.Say(command.channel, message);
}

// Expose public methods here
module.exports =
{
	commands:
	{
		'!dice' : DiceCommand,
		'!roll' : DiceCommand
	},
	
	options
};