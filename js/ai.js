function AI(grid) {
  this.grid = grid;
}

// static evaluation function
AI.prototype.eval = function() {	
	return -this.grid.evalSnakeShape();
  /*var emptyCells = this.grid.availableCells().length;

  var smoothWeight = 0.1,      
      mono2Weight  = 1.0,
      emptyWeight  = 2.7,
      maxWeight    = 1.0;

  return this.grid.smoothness() * smoothWeight       
       + this.grid.monotonicity2() * mono2Weight
       + Math.log(emptyCells) * emptyWeight
       + this.grid.maxValue() * maxWeight;/**/
};

//AI.prototype.cache = {}

// alpha-beta depth first search
AI.prototype.search = function(depth, alpha, beta, positions, cutoffs) {
  var bestScore;
  var bestMove = -1;
  var result;

  // the maxing player
  if (this.grid.playerTurn) {
    bestScore = alpha;
    for (var direction in [0, 1, 2, 3]) {
      var newGrid = this.grid.clone();
      if (newGrid.move(direction).moved) {
        positions++;
        if (newGrid.isWin()) {
          return { move: direction, score: 10000, positions: positions, cutoffs: cutoffs };
        }
        var newAI = new AI(newGrid);

        if (depth == 0) {
          result = { move: direction, score: newAI.eval() };
        } else {
          result = newAI.search(depth-1, bestScore, beta, positions, cutoffs);
          if (result.score > 9900) { // win
            result.score--; // to slightly penalize higher depth from win
          }
          positions = result.positions;
          cutoffs = result.cutoffs;
        }

        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = direction;
        }
        if (bestScore > beta) {
          cutoffs++
          return { move: bestMove, score: beta, positions: positions, cutoffs: cutoffs };
        }
      }
    }
  }

  else { // computer's turn, we'll do heavy pruning to keep the branching factor low
    bestScore = beta;

    // try a 2 and 4 in each cell and measure how annoying it is
    // with metrics from eval
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };
    for (var value in scores) {
      for (var i in cells) {
        scores[value].push(null);
        var cell = cells[i];
        var tile = new Tile(cell, parseInt(value, 10));
        this.grid.insertTile(tile);
        scores[value][i] = -this.grid.smoothness() + this.grid.islands();
        this.grid.removeTile(cell);
      }
    }    

    // now just pick out the most annoying moves
    var maxScore = Math.max(Math.max.apply(null, scores[2]), Math.max.apply(null, scores[4]));
    for (var value in scores) { // 2 and 4
      for (var i=0; i<scores[value].length; i++) {
        if (scores[value][i] == maxScore) {
          candidates.push( { position: cells[i], value: parseInt(value, 10) } );
        }
      }
    }

    // search on each candidate
    for (var i=0; i<candidates.length; i++) {
      var position = candidates[i].position;
      var value = candidates[i].value;
      var newGrid = this.grid.clone();
      var tile = new Tile(position, value);
      newGrid.insertTile(tile);
      newGrid.playerTurn = true;
      positions++;
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        cutoffs++;
        return { move: null, score: alpha, positions: positions, cutoffs: cutoffs };
      }
    }
  }

  return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
}

// performs a search and returns the best move
AI.prototype.getBest = function() {	
	return this.findBestMove(this.grid, 10000);
}

AI.prototype.findBestMove = function(grid, allowedCallCnt) {	
	allowedCallCnt--;
	var max = -1e100;
	var bestDir;
	var newGrids = [];
	var aCellsCnt = 0;
	for (var direction in [0, 1, 2, 3]) {
      var newGrid = grid.clone();	  
	  if(newGrid.move(direction).moved) {
		  newGrid.aCells = newGrid.availableCells();
		  aCellsCnt += newGrid.aCells.length;
		  newGrids.push(newGrid);
	  } else {
	      newGrids.push(null);
	  }
	}
	
	aCellsCnt *= 2;
	var nextLevelCalls;
	if(aCellsCnt == 0) {
		nextLevelCalls = 0;
	} else {
		nextLevelCalls = Math.floor(allowedCallCnt / aCellsCnt);
	}	
	
	for (var direction in [0, 1, 2, 3]) {
      var newGrid = newGrids[direction];
	  if(newGrid == null) {
		continue;
	  }      
        var test = 0;
		if(nextLevelCalls == 0) {
			test = newGrid.evalSnakeShape();		
		} else {
			var cells = newGrid.aCells;
			for(var i in cells) {
				var cell = cells[i];
				newGrid.insertTile(new Tile(cell, 2));
				test += this.findBestMove(newGrid, nextLevelCalls).score * 0.9;
				newGrid.removeTile(cell);
				newGrid.insertTile(new Tile(cell, 4));
				test += this.findBestMove(newGrid, nextLevelCalls).score * 0.1;	
				newGrid.removeTile(cell);
			}
			test /= cells.length;
		}/**/
		if(test > max || bestDir == undefined) {
			max = test;
			bestDir = direction;
		}		      
    }	
	return {move: bestDir, score : max};
}

AI.prototype.translate = function(move) {
 return {
    0: 'up',
    1: 'right',
    2: 'down',
    3: 'left'
  }[move];
}

