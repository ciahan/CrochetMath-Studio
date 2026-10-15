import { Fragment } from "react"

import { createRowPattern } from "../utils/patternUtils";

import RowPatternComponent from "./RowPatternComponent";

export default function RowPattern({ pattern, row }) {
    const rowPattern = createRowPattern(pattern, row);

    return (
        <div className="rowPattern">
            {rowPattern.map((rowComponent, rowComponentIndex) => (
                <RowPatternComponent 
                    key={rowComponentIndex}
                    colStart={rowComponent.colStart}
                    colEnd={rowComponent.colEnd}
                    isDc={rowComponent.isDc}
                    isLast={rowComponentIndex === rowPattern.length - 1}
                />
            ))}
        </div>
    )
}