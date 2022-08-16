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
};