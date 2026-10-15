import { useState, useEffect, useRef } from "react";

import PatternEditor from "../components/PatternEditor"
import RenderedPattern from "../components/RenderedPattern"
import CreatePattern from "../components/CreatePattern"

import { 
    createPattern,
    downloadPattern,
    importPattern,
    applyDc,
    resetPattern,
    drawFunction,
    repeatPattern,
} from "../utils/patternUtils"

export default function MathStudio() {
    const [currentPattern, setCurrentPattern] = useState(null);
    const [editing, setEditing] = useState(false);
    const [selectedFunction, setSelectedFunction] = useState("sin");
    const [orientation, setOrientation] = useState("");
    const [repeat, setRepeat] = useState(false);
    const [numRepeats, setNumRepeats] = useState(null);
    const prevNumRepeats = useRef(numRepeats);

    useEffect(() => {
        if (currentPattern === null) {
            return;
        }

        if (numRepeats === null || numRepeats === 0) {
            setCurrentPattern(previousPattern =>
                drawFunction(resetPattern(previousPattern), selectedFunction, orientation)
            )
        }
    }, [selectedFunction, orientation])

    useEffect(() => {
        if (currentPattern === null) {
            return;
        }

        const previousNumRepeats = prevNumRepeats.current;
        if (numRepeats >= 0 && numRepeats !== null) {
            setCurrentPattern(previousPattern => 
                repeatPattern(previousPattern, numRepeats, previousNumRepeats, orientation)
            );
            prevNumRepeats.current = numRepeats;
        }
    }, [numRepeats]);

    function handleCreatePattern(rows, cols) {
        setCurrentPattern(createPattern(rows, cols))
        if (rows >= cols) {
            setOrientation("vertical")
        } else {
            setOrientation("horizontal")
        }
    };

    function handleStitchClick(row, col) {
        if (editing) {
            setCurrentPattern(previousPattern => {
                const newGrid = structuredClone(previousPattern.grid);

                applyDc(previousPattern.rowColors, newGrid, row, col);

                return {
                    ...previousPattern,
                    grid: newGrid,
                }
            })
        }
    }

    function handleSavePattern() {
        downloadPattern(currentPattern);
    }

    async function handleImportPattern(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }

        try {
            const importedPattern = await importPattern(file);
            setCurrentPattern(importedPattern);
        } catch (error) {
            console.error("Could not import pattern:", error);
        }
    }

    return (
        <>
            {currentPattern === null ? (
                <CreatePattern 
                    onCreate={handleCreatePattern}
                    onImport={handleImportPattern}
                    mathStudio={true}
                />
            ) : (
                <div className="flex">
                    <PatternEditor 
                        mathStudio={true}
                        selectedFunction={selectedFunction}
                        setSelectedFunction={setSelectedFunction}
                        editing={editing}
                        setEditing={setEditing}
                        orientation={orientation}
                        setOrientation={setOrientation}
                        repeat={repeat}
                        setRepeat={setRepeat}
                        numRepeats={numRepeats}
                        setNumRepeats={setNumRepeats}
                        handleSavePattern={handleSavePattern}
                    />
                    <div>
                        <RenderedPattern 
                            pattern={currentPattern}
                            onStitchClick={handleStitchClick}
                        />
                    </div>
                </div>
            )}
        </>
    )
}