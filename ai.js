// Game Constants
const DECISION_MOVE = "move";
const DECISION_KILL = "kill";

// Returns an array of chips that can kill
function getKillers(team)
{
	return filterChips (team, (option) => option.kills.length > 0);
}

// Returns an array of chips that can move
function getMovers(team)
{
	return filterChips (team, (option) => option.kills.length == 0);
}

function filterChips (team, filterMethod)
{
	let chips = getChips (team);
	let filtered = [];

	for (let chip of chips)
	for (let option of (isPromoted (chip) ? getPromotedMoves (getCell (chip), team.className) : getMoves (getCell (chip), team.className)))
		if (filterMethod (option))
			filtered.push ({
				chip: chip,
				option: option
			});

	return filtered;
}

// Returns the threateners
function getThreat(chip)
{
	let threats = [];
	// Retrieve chip's team
	let team = getChipTeam (chip);
	// Retrieve cell
	let cell = getCell (chip);
	// Retrieve this chip possible options
	let options = isPromoted (chip) ? getPromotedMoves (cell, team) : getMoves (cell, team);
	// Create virtual chips
	let virtualChips = [];
	for (let option of options)
	{
		let chip = document.createElement ('div');
		chip.classList.add ('chip');
		chip.classList.add (team);
		chip.style.display = 'none';
		// Append virtual chip
		option.cell.appendChild (chip);
		// Save it for later
		virtualChips.push (chip);
	}
	// Retrieve the enemy team chips
	let enemyTeam = pOne.className == team ? pTwo : pOne;
	let enemyChips = getChips (enemyTeam);
	// Search in the possible kill options of enemy chips
	for (let enemyChip of enemyChips)
	{
		// Retrieve possible options
		let enemyCell = getCell (enemyChip);
		let enemyChipOptions = isPromoted (enemyChip) ? getPromotedMoves (enemyCell, enemyTeam.className) : getMoves (enemyCell, enemyTeam.className);
		// Search in the options if the possible move of the threathened chip is going to be killed
		for (let enemyChipOption of enemyChipOptions)
		for (let virtualChip of virtualChips)
			if (enemyChipOption.kills.includes (virtualChip))
				threats.push (getCell (virtualChip));
	}
	// Destroy virtual chips
	for (let vc of virtualChips) vc.remove ();

	return threats;
}

// COM moves
function counterplay(team)
{	
	// Retrieve total options
	let totalKills = getKillers (team);
	let totalMoves = getMovers (team);
	// Retrieve safe decisions
	let safeKills = totalKills.filter ((option) => getThreat (option.chip).length == 0);
	let safeMoves = totalMoves.filter ((option) => getThreat (option.chip).length == 0);
	// Decide which options to act upon
	let choices = safeKills.length == 0 ? safeMoves : safeKills;
	// If there are no safe choices
	if (choices.length == 0)
		choices = totalKills.length == 0 ? totalMoves : totalKills;
	// If there are no choices at all
	if (choices.length == 0)
		return null;
	// Get a random index
	let randomIndex = getRandomInt(0, choices.length - 1);
	// Return a random safe choice
	return choices[randomIndex];
}

function getRandomInt(min, max) 
{
    min = Math.ceil(min);
    max = Math.floor(max);
	
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
