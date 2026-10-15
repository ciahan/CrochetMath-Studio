// at the start of each row, tells users the number and color of yarn
export default function RowCell ({
    color,
    rowNum,
    expandRow,
    highlighted,
}) {
    return (
        <>
            <div
                className={`rowCell ${highlighted ? "highlighted" : ""}`}
                style={{
                    backgroundColor: `color-mix(in srgb, ${color} 50%, transparent)`,
                    color: "var(--rowNums)",
                }}
                onClick={expandRow}
            >
                {rowNum}
            </div>
        </>
    )
}