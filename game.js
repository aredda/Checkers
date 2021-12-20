// Game config
let rows = 8, cols = 8;
let cellSize = 75;

let pageSize = 
{
	height: $(document).height(),
	width: $(document).width()
};

let pOne = {
	className: "bg-blue",
	base: 1,
	rows: [1, 2, 3],
	chips: []
};

let pTwo = {
	className: "bg-red",
	base: 8,
	rows: [6, 7, 8],
	chips: []
};

let focusedCell = "highlighted";
let promotedChip = "crowned";
let board = document.getElementById("board");

// Game state
let turn = pTwo;

// Game initial settings
board.style.width = cols * cellSize;
board.style.height = rows * cellSize;

function getChip(cell) { return cell.childNodes[0]; }

function getChips(team) { return document.getElementsByClassName(team.className); }

function getCell(chip) { return chip.parentElement; }

function getPosition(cell) 
{
	let p = cell.id.split("-");

	return {
		x: parseInt(p[0]),
		y: parseInt(p[1])
	};
}

function findCell(position) { return document.getElementById(position.x + "-" + position.y); }

function getChipTeam(chip) { return chip.classList.contains(pOne.className) ? pOne.className : pTwo.className; }

function isPromoted (chip) { return chip.classList.contains(promotedChip); }

/**
 * Get all the possible options of one chip to choose 
 */
function getMoves (cell, team)
{
	// Determine directions depending on the team
	let yDir = team == pOne.className ? 1 : -1;
	let xDirs = [1, -1];
	// Final options
	let finalOptions = [];
	// Check in each x direction
	for (let x of xDirs)
	{
		// Represents all the options of taking that route
		let option = 
		{
			cell: null,
			kills: []
		};
		// Construct the next cell's position
		let nextPos = {
			x:  getPosition (cell).x + x,
			y:	getPosition (cell).y + yDir
		};
		// then get the next cell using the position
		let nextCell = findCell (nextPos);
		// Check if there is a cell located on that position
		if (nextCell == null) continue;
		// Retrieve the chip of that cell
		let nextChip = getChip (nextCell);
		// Check if there's a chip in the first place
		// If not there's an available cell that the chip can move to
		if (nextChip == null)
		{
			finalOptions.push ({
				cell: nextCell,
				kills: []
			});

			continue;
		}
		// It means this is a confrontation
		// Retrieve the team of the chip
		let nextChipTeam = getChipTeam (nextChip);
		// Check if the next chip is in the same team
		if (nextChipTeam == team) continue;
		// Mark the chip as threathened
		let chipInDanger = nextChip;
		// Update landing position
		nextPos = {
			x: nextPos.x + x,
			y: nextPos.y + yDir
		};
		// Update landing cell
		nextCell = findCell (nextPos);
		// Check if the cell exists
		if (nextCell == null) continue;
		// Update next chip
		nextChip = getChip (nextCell);
		// Check if the cell is empty
		if (nextChip != null) continue;
		// Add the kill option
		option = {
			cell: nextCell,
			kills: [chipInDanger]
		};
		// Detection queue
		let queue = [nextCell];
		// Detect if there is a chain of consecutive kills
		do
		{
			// Get available moves of that next cell
			let nextCellMoves = getMoves (queue.shift (), team);
			// Check if there is a kill move
			for (let cellMove of nextCellMoves)
				if (cellMove.kills.length > 0)
					option = {
						cell: cellMove.cell,
						kills: option.kills.concat (cellMove.kills)
					}
		}
		while (queue.length != 0);
		// Add it to array of final options
		finalOptions.push (option);
	}
	// Return the found options
	return finalOptions;
}

/**
 * Get moves of a promoted chip
 */
function getPromotedMoves (cell, team)
{
	// Set up directions
	let xDirs = [1, -1];
	let yDirs = [1, -1];
	// Prepare the array to be returned
	let finalOptions = [];

	for (let x of xDirs)
	for (let y of yDirs)
	{
		let currCell = cell;
		let nextCell = null;
		let nextPos = getPosition (cell);
		// Keep checking until the next cell is out of bounds
		do
		{
			// Update the position
			nextPos = {
				x: nextPos.x + x,
				y: nextPos.y + y
			};
			// Update cell
			nextCell = findCell (nextPos);
			// Check if the next cell is available
			if (nextCell != null)
			{
				// If the cell is empty
				if (getChip (nextCell) == null)
				{
					// Check if the previous cell is occupied
					let chip = getChip (currCell);
					// Check if it's an enemy chip
					if (chip != null)
					if (getChipTeam (chip) == team)
						chip = null;
					// Add option
					finalOptions.push ({
						cell: nextCell,
						kills: chip == null ? [] : [chip]
					});
					// Update the current cell
					currCell = nextCell;

					continue;
				}
				// If the cell is not empty
				// If the chip on that cell is on the same team
				// Just continue
				if (team == getChipTeam (getChip (nextCell)))
					break;
				// If it's not on the same team
				currCell = nextCell;
			}
		}
		while (nextCell != null);
	}

	return finalOptions;
}

/**
 * Checks if options contain a kill option,
 * if it's true, it will eliminate move options 
 */
function prioritizeKilling (options)
{
	let killOptions = options.filter ( (o) => o.kills.length > 0 );  

	if ( killOptions.length > 0 )
		return killOptions;

	return options;
}

function showPossibleMoves(cell) 
{
	// Retrieve the possible options for that cell
	let result = isPromoted (getChip (cell)) ? getPromotedMoves (cell, pTwo.className) : getMoves (cell, pTwo.className);
	// Prioritize killing if there are any
	result = prioritizeKilling (result);
	// Unhighlight all cells
	unhighlight();
	// Configure cell's click event
	for (let option of result) 
	{
		let highlightedCell = option.cell;
		let { kills } = option;
		// Configure cell's click event
		highlightedCell.onclick = function ()
		{ 
			move(highlightedCell, getChip (cell), kills);
		};
		// Highlight this cell
		highlightCell(highlightedCell);
	}
}

function move(cell, chip, chipsToKill = []) 
{
	let activeChip = chip;
	// Put chip on that cell
	cell.appendChild(activeChip);
	cell.onclick = null;
	// Kill whoever in the way
	for (let killedChip of chipsToKill)
		$(killedChip).fadeOut(500, function () { $(this).remove(); });
	// Promote the chip
	if (!isPromoted (chip) && (getPosition(cell).y === pOne.base || getPosition(cell).y === pTwo.base))
		promote (activeChip);
	// unhighlight other chips
	unhighlight();
	// Deliver turn
	setTimeout (() => {changeTurn();}, 750);
}

function promote(chip)
{
	// Mark as promoted
	addClass(chip, promotedChip);
	// Display the crown visually
	let crown = document.createElement("img");
	crown.setAttribute("src", "sprites/crown.png");
	chip.appendChild(crown);
}

function gameOver (winner)
{
	let result = winner != pTwo ? {cls:"bg-lose", msg: "You lost, try harder next time!"} : {cls: "bg-win", msg:"Congratulations! You are the winner!"} ;
		
	$("#pop-up > .header").addClass(result.cls);
	$("#pop-up > .body").text(result.msg);
	$("#pop-up").fadeIn(250);
}

function changeTurn() 
{
	// Winning condition
	if (getChips(pOne).length == 0 || getChips(pTwo).length == 0) 
	{
		gameOver (getChips(pOne).length == 0 ? pTwo : pOne);
	}
	else
	{
		// Change turn
		turn = (turn === pOne) ? pTwo : pOne;
		// Changing turn effect
		document.body.style.background = turn == pOne ? '#9ed9f0' : '#ed978c';
		// If it's COM turn, then play
		setTimeout (() => 
		{
			if (turn === pOne) 
			{
				let comChoice = counterplay (turn);

				if (comChoice == null)
					gameOver (pTwo);
	
				move (comChoice.option.cell, comChoice.chip, comChoice.option.kills);
			}
		}, 1500);
	}
}

function createBoard(board, rows, cols, p1, p2) 
{
	// False 	=> BLACK, True 	=> WHITE
	let cellColor = false;
	for (i = 1; i <= rows; i++) {
		for (j = 1; j <= cols; j++) {
			let cell = document.createElement("div");
			addClass(cell, "board-cell");
			addClass(cell, cellColor ? "bg-white" : "bg-black");
			cell.id = j + "-" + i;

			if (!cellColor && (p1.includes(i) || p2.includes(i))) 
			{
				let chipColor = p1.includes(i) ? pOne.className : pTwo.className;

				let chip = document.createElement("div");
				addClass(chip, "chip");
				addClass(chip, chipColor);
				addClass(chip, "clickable");

				// Put the chip on the board cell
				cell.appendChild(chip);
				// Configure the click of the chip
				chip.onclick = function () {
					// Don't accept the command if it's not the player's turn
					if (turn.className !== getChipTeam(this))
						return;
					// Show next movements
					showPossibleMoves(this.parentElement);
				};
				// Save the chip
				(chipColor == pOne.className ? pOne : pTwo).chips.push (chip);
			}
			// Add it to the board element
			board.appendChild(cell);
			// Change color 
			cellColor = !cellColor;
		}
		// Change color
		cellColor = !cellColor;
	}
}

function centerBoard (board)
{
	// Get the window's size
	let pageSize = {
		width: document.body.offsetWidth,
		height: document.body.offsetHeight
	};
	// Get the board size
	let boardSize = {
		width: board.offsetWidth,
		height: board.offsetHeight
	};
	// Calculate offset
	let boardOffset = {
		x: (pageSize.width / 2) - (boardSize.width / 2),
		y: (pageSize.height / 2) - (boardSize.height / 2)
	};
	// Reposition the board
	board.style.left = boardOffset.x;
	board.style.top = boardOffset.y;
}

function addClass(e, cls) { e.classList.add(cls); }

function removeClass(e, cls) { e.classList.remove(cls); }

function unhighlight() 
{
	while (document.getElementsByClassName(focusedCell).length > 0)
		for (let highlightedCell of document.getElementsByClassName(focusedCell))
		{
			// Remove the click event
			highlightedCell.onclick = null;
			// Remove highlighted class
			removeClass (highlightedCell, focusedCell);
		}
}

function highlightCell(cell) { addClass(cell, focusedCell); }

createBoard (board, rows, cols, pOne.rows, pTwo.rows);
centerBoard (board);
changeTurn ();
