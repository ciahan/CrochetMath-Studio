export default function RowPatternComponent({
    isDc,
    rowIndex,
    colStart,
    colEnd,
    isLast,
}) {
    const numStitches = colEnd - colStart + 1;

    return (
        <span>
            {numStitches > 1 && `${numStitches} `}
            {isDc ? "dc" : "sc"}
            {!isLast && ", "}
        </span>
    )
}