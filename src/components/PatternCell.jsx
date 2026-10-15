export default function PatternCell({ 
    row,
    col,
    color,
    isDc, // if the pattern says this stitch should be a double crochet
    canDc, // can do a double crochet down to the previous row
    onClick,
}) {
    return (
        <>
            <div
                className="patternCell"
                style={{
                    backgroundColor: color,
                    cursor: canDc ? "pointer" : "default",
                }}
                onClick={() => {
                    if (canDc) {
                        onClick(row, col);
                    }
                }}
            >
                {isDc &&
                    <span
                        style={{
                            color: "var(--rowNums)"
                        }}
                    >
                        X 
                    </span>
                }
            </div>
        </>
    )
}