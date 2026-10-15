export const pattern = {
    id: "test",
    name: "Test",
    
    rows: 15,
    cols: 15,

    borderColor: "#000000",
    colors: [
        "var(--light-blue)",
        "var(--gray)",
    ],
    rowColors: [],

    grid: [],
};

for (let r = pattern.rows - 1; r >= 0; r--) {
    const row = [];
    let rowColor = 0;
    if (r%2 == 1) {
        rowColor = 1;
    }
    pattern.rowColors.push(rowColor);
    for (let c = 0; c < pattern.cols; c++) {
        row.push({
            color: rowColor,
            isDc: false,
        });
    }
    pattern.grid.push(row);
};