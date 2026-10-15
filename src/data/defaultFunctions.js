export const defaultFunctions = [
    {
        id: "sin",
        name: "Sine",
        label: "y = sin(x)",
        fn: function(x, rows, cols, orientation) {
            if (orientation == "vertical") {
                return (cols - 1)/2 + (cols - 1)/2 * Math.sin(x*(2*Math.PI)/(Math.floor(rows/2) - 1));
            } else if (orientation == "horizontal") {
                const greyRows = Math.floor(rows/2);
                const usableRows = (greyRows - 1)*2 - 1 - 1;
                return usableRows/2 + usableRows/2 * Math.sin(x*(2*Math.PI)/cols);
            }
        }
    },
    {
        id: "cos",
        name: "Cosine",
        label: "y = cos(x)",
        fn: function(x, rows, cols, orientation) {
            if (orientation == "vertical") {
                return (cols - 1)/2 + (cols - 1)/2 * Math.cos(x*(2*Math.PI)/(Math.floor(rows/2) - 1));
            } else if (orientation == "horizontal") {
                const greyRows = Math.floor(rows/2);
                const usableRows = (greyRows - 1)*2 - 1 - 1;
                return usableRows/2 + usableRows/2 * Math.cos(x*(2*Math.PI)/cols);
            }
        }
    },
    {
        id: "tan",
        name: "Tangent",
        label: "y = tan(x)",
        fn: function (x, rows, cols, orientation) {
            const maxAngle = 1.4; // a little less than PI/2
            if (orientation == "vertical") {
                const centerY = (cols-1)/2;
                const centerX = (Math.floor(rows/2) - 2)/2;
                const angle = (x - centerX) * maxAngle / centerX;
                const scale = centerY / Math.abs(Math.tan(maxAngle));
                return centerY + scale * Math.tan(angle);
            } else if (orientation == "horizontal") {
                const centerX = (cols - 1)/2;
                const greyRows = Math.floor(rows/2);
                const usableRows = (greyRows - 1)*2 - 1 - 1;
                const centerY = usableRows / 2;
                const angle = (x - centerX) * maxAngle / centerX;
                const scale = centerY / Math.abs(Math.tan(maxAngle));
                return centerY + scale * Math.tan(angle);
            }
        }
    },
    {
        id: "triangular",
        name: "Triangular Wave",
        label: "",
        fn: function (x, rows, cols, orientation) {
        const centerX = (rows) => (Math.floor(rows/2) - 1)/2;
            if (orientation == "vertical") {
                if (x < centerX(rows)) { // Piecewise!!!
                    return (x*(cols-1)/centerX(rows));
                } else if (x >= centerX(rows)) {
                    return (2*(cols - 1) - x*(cols - 1)/centerX(rows));
                }
            } else if (orientation == "horizontal") {
                const greyRows = Math.floor(rows/2);
                const usableRows = (greyRows - 1)*2 - 1 - 1;
                const centerX = (cols - 1)/2;
                if (x < centerX) {
                    return x*usableRows/centerX;
                } else if (x >= centerX) {
                    return usableRows - (x-centerX)*usableRows/centerX;
                }
            }
        }
    },
    {
        id: "rectangular",
        name: "Rectangular Wave",
        fn: function (x, rows, cols, orientation) {
            if (orientation == "vertical") {
                const centerX = (rows) => Math.round((Math.floor(rows/2) - 1)/2);
                if (x == 0) {
                    return -1;
                } else if (x < centerX(rows)) {
                    return 0;
                } else if (x == centerX(rows)) {
                    return -1;
                } else if (x > centerX(rows)) {
                    return cols-1;
                }
            } else if (orientation == "horizontal") {
                const centerX = cols/2
                const greyRows = Math.floor(rows/2);
                const usableRows = (greyRows - 1)*2 - 1 - 1;
                if (x == 0) {
                    return -1;
                } else if (x < centerX) {
                    return 0;
                } else if (x == Math.round(centerX)) {
                    return -1;
                } else if (x > centerX) {
                    return usableRows;
                }
            }
        }
    },
    {
        id: "sawtooth",
        name: "Sawtooth Wave",
        fn: function (x, rows, cols, orientation) {
            if (orientation == "vertical") {
                if (x == 0) {
                    return - 1;
                } else {
                    return (x*(cols-1)/(Math.floor(rows/2)-1));
                }
            } else if (orientation == "horizontal") {
                if (x == 0) {
                    return -1;
                } else {
                    const greyRows = Math.floor(rows/2);
                    const usableRows = (greyRows - 1)*2 - 1 - 1;
                    return x*usableRows/cols;
                }
            }
        }
    }
]