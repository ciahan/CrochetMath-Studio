import { useState } from "react";

import PatternEditor from "../components/PatternEditor"
import RenderedPattern from "../components/RenderedPattern"
import CreatePattern from "../components/CreatePattern"

import { 
    createPattern,
    downloadPattern,
    importPattern,
    applyDc 
} from "../utils/patternUtils"

export default function MosaicCrochetPatternMaker() {
    const [currentPattern, setCurrentPattern] = useState(null);
    const [editing, setEditing] = useState(true);

    function handleCreatePattern(rows, cols) {
        setCurrentPattern(createPattern(rows, cols))
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
                />
            ) : (
                <>
                    <div className="flex">
                        <PatternEditor
                            editing={editing}
                            setEditing={setEditing}
                            handleSavePattern={handleSavePattern}
                        />
                        <div>
                            <RenderedPattern 
                                pattern={currentPattern}
                                onStitchClick={handleStitchClick}
                            />
                        </div>
                    </div>
                </>
            )}
        </>
    )
}