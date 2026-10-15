import { 
    Fragment,
    useState
} from "react";

import RowCell from "./RowCell";
import PatternCell from "./PatternCell";
import RowPattern from "./RowPattern"

import { canDc } from "../utils/patternUtils"

export default function RenderedPattern({
    pattern,
    onStitchClick,
}) {
    const [expandedRow, setExpandedRow] = useState(null);

    return (
        <>
            <div 
                className="patternGrid"
                style={{
                    gridTemplateColumns: `repeat(${pattern.cols + 1}, 40px)`,
                    gridAutoRows: '40px'
                }}
            >
                {pattern.grid.map((row, rowIndex) => (
                    <Fragment
                        key={rowIndex}
                    >
                        <RowCell 
                            color={pattern.colors[pattern.rowColors[rowIndex]]}
                            rowNum={pattern.rows - rowIndex}
                            expandRow={() => setExpandedRow((previousRow) =>
                                previousRow === rowIndex ? null : rowIndex
                            )}
                            highlighted={expandedRow === rowIndex}
                        />
                        {row.map((cell, colIndex) => (
                            <PatternCell
                                key={`${rowIndex}-${colIndex}`}
                                row={rowIndex}
                                col={colIndex}
                                color={pattern.colors[cell.color]}
                                borderColor={pattern.borderColor}
                                isDc={cell.isDc}
                                canDc={canDc(pattern, rowIndex, colIndex)}
                                onClick={onStitchClick}
                            />
                        ))}

                        {expandedRow === rowIndex && (
                            <RowPattern 
                                pattern={pattern}
                                row={rowIndex}
                            />
                        )}
                    </Fragment>
                ))}
            </div>
        </>
    )
}