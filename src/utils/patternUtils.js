import { defaultFunctions } from "../data/defaultFunctions"

export function createPattern(rows, cols) {
    const rowColors = Array.from(
        { length: rows },
        (_, row) => ((rows - row) + 1) % 2
    );

    const grid = Array.from({ length: rows}, (_, row) =>
        Array.from({ length: cols }, () => ({
            color: ((rows - row) + 1) % 2,
            isDc: false,
        }))
    );

    return {
        id: crypto.randomUUID(),
        name: "Untitled Pattern",
        rows,
        cols,
        colors: {
            0: "#3d4e78",
            1: "#818181",
        },
        rowColors,
        grid,
    }
};

export function createRowPattern(pattern, rowIndex) {
    const row = pattern.grid[rowIndex];
    const rowPattern = [];
    let colStart = 0;
    let prevStitch = row[0].isDc;
    for (let c = 0; c < pattern.cols; c++) {
        const currentStitch = row[c].isDc;
        if (prevStitch != currentStitch) {
            const rowPatternComponent = {
                colStart: colStart,
                colEnd: c - 1,
                isDc: prevStitch,
            };
            rowPattern.push(rowPatternComponent);
            colStart = c;
            prevStitch = currentStitch;
        }
    }
    const rowPatternComponent = {
        colStart: colStart,
        colEnd: pattern.cols - 1,
        isDc: prevStitch,
    };
    rowPattern.push(rowPatternComponent);
    return rowPattern;
};

export function downloadPattern(pattern) {
    const json = JSON.stringify(pattern, null, 2);
    
    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "crochet-pattern.json";
    link.click();

    URL.revokeObjectURL(url);
};

export function importPattern(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            try {
                const pattern = JSON.parse(reader.result);
                resolve(pattern);
            } catch (error) {
                reject(error);
            }

            reader.onerror = () => {
                reject(reader.error);
            };
        }
        
        reader.readAsText(file);
    }) 
};

export function canDc(pattern, row, col) {
    if (row >= pattern.rows - 2) { // stitches in first two rows cannot be double crochets
        return false;
    } else {
        const stitchBelow = pattern.grid[row + 1][col];
        const stitchAbove = pattern.grid[row - 1]?.[col];
        if (stitchBelow.isDc || stitchAbove?.isDc) {
            return false;
        };
        return true;
    }
};

export function applyDc(rowColors, grid, row, col) {
    const clickedStitch = grid[row][col];
    const stitchBelow = grid[row + 1][col];

    clickedStitch.isDc = !clickedStitch.isDc;
    if (clickedStitch.isDc) {
        stitchBelow.color = rowColors[row];
    } else {
        stitchBelow.color = rowColors[row + 1];
    }
};

export function resetPattern(pattern) {
    const newGrid = [];

    for (const rowColor of pattern.rowColors) {
        const newRow = [];
        for (let c = 0; c < pattern.cols; c++) {
            const newStitch = {
                color: rowColor,
                isDc: false,
            }
            newRow.push(newStitch)
        }
        newGrid.push(newRow);
    }

    const newPattern = {
        ...pattern,
        grid: newGrid,
    }
    return newPattern;
};

export function drawFunction(pattern, selectedFunction, orientation) {
    const func = defaultFunctions.find(
        (func) => func.id === selectedFunction
    );

    const newGrid = structuredClone(pattern.grid);
    
    // drawing the actual function
    if (orientation == "vertical") {
        let x = 0;
        for (let r = pattern.rows - 4; r >= 0; r = r-2) {
            const y = Math.round(func.fn(x, pattern.rows, pattern.cols, orientation));
            if (y == -1) {
                for (let c = 0; c < pattern.cols; c++) {
                    applyDc(pattern.rowColors, newGrid, r, c);
                }
            } else if (y >= 0 && y < pattern.cols) {
                applyDc(pattern.rowColors, newGrid, r, y);
            }
            x++;
        }
    } else if (orientation == "horizontal") {
        for (let c = 0; c < pattern.cols; c++) {
            const rawY = func.fn(c, pattern.rows, pattern.cols, orientation);
            const y = pattern.rows - (4 + Math.round(rawY/2)*2);
            if (rawY == -1) {
                for (let r = pattern.rows - 4; r >= 0; r = r-2) {
                    applyDc(pattern.rowColors, newGrid, r, c);
                }
            } else if (y >= 0 && y < pattern.rows) {
                applyDc(pattern.rowColors, newGrid, y, c);
            }
        }
    }

    const newPattern = {
        ...pattern,
        grid: newGrid,
    };

    // fillilng in the surrounding background
    for (let r = pattern.rows - 3; r >= 0; r = r-2) {
        for (let c = 0; c < pattern.cols; c++) {
            if (canDc(newPattern, r, c)) {
                applyDc(pattern.rowColors, newPattern.grid, r, c);
            }
        }
    }
    return newPattern;
};

export function repeatPattern (pattern, numRepeats, prevNumRepeats, orientation) {
    if (prevNumRepeats == null) {
        prevNumRepeats = 0;
    }
    if (orientation == "horizontal") {
        const newGrid = [];
        console.log("prevNumRepeats:", prevNumRepeats);
        console.log("numRepeats:", numRepeats);
        for (let r = 0; r  < pattern.rows; r++) {
            const row = [];
            for (let reps = 0; reps < numRepeats + 1; reps++) {
                for (let c = 0; c < pattern.cols/(prevNumRepeats + 1); c++) {
                    row.push({ ...pattern.grid[r][c] });
                }
            }
            newGrid.push(row);
        }
        const newPattern = {
            ...pattern,
            cols: pattern.cols/(prevNumRepeats + 1) * (numRepeats + 1),
            grid: newGrid,
        };
        return newPattern;
    } else if (orientation == "vertical") {
        const greyRows = Math.floor(rows/2);
        const usableRows = (greyRows - 1)*2;
        const noRepGrid = [];
        for (let r = 0; r < pattern.rows/(prevNumRepeats + 1); r++) {
            noRepGrid.push({ ...pattern.grid[r] });
        }

        for (let reps = 0; reps < numRepeats; reps++) {
            for (let r = (3 - 1); r < (3 + usableRows - 1); r++) {
                const blankRow = [];
                
            }
        }
        const newPattern = {
            ...pattern
        }
    }
}