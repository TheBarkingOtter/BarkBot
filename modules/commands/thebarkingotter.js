var greetings = 
{
	'hypervirtualextreme' : 'things are about to get hyyyypppeeerrr!',
	'justalittlefunky' : 'did it just get funky in here? NeonFunky',
	'kamal404' : 'PigeonPls PigeonPls PigeonPls',
	'rmgbread' : 'FeelsTetrisMan',
	'schrinkl' : 'FeelsLateMan',
	'schrinikl' : 'FeelsLateMan',
	'xx_djpera_xx' : 'freddyPls hi dj! freddyPls'
}

/////////////////////////////////////////////////////
// Dance!
/////////////////////////////////////////////////////
function DanceCommand(command)
{
	command.client.say(command.channel, "pepeD pepeD pepeD pepeD");
}

// Expose public methods here
module.exports =
{
	commands:
	{
		'dancetime!' : DanceCommand
	},
	
	greetings
};