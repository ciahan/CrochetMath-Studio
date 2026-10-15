import { defaultFunctions } from "../data/defaultFunctions"

export default function PatternEditor ({
    editing,
    setEditing,
    mathStudio,
    selectedFunction,
    setSelectedFunction,
    orientation,
    setOrientation,
    repeat,
    setRepeat,
    numRepeats,
    setNumRepeats,
    handleSavePattern,
}) {
    return (
        <aside className="patternEditor flex flex-col gap-8 mb-10">
            <h1>
                Pattern Editor
            </h1>
            {mathStudio && (
                <div className="flex flex-col gap-8">
                    {/* DEFAULT FUNCTIONS */}
                    <div className="flex flex-col gap-2">
                        <h2>
                            Default Functions:
                        </h2>
                        {defaultFunctions.map((func) => (
                            <button
                                key={func.id}
                                onClick={() => setSelectedFunction(func.id)}
                                className={`function ${selectedFunction === func.id ? "selected" : ""}`}
                            >
                                {func.name}
                            </button>
                        ))}
                    </div>
                    {/* ORIENTATION */}
                    <div className="flex flex-col gap-2">
                        <h2>
                            Orientation:
                        </h2>
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setOrientation("vertical")}
                                className={`function ${orientation === "vertical" ? "selected" : ""}`}
                            >
                                Vertical
                            </button>
                            <button
                                onClick={() => setOrientation("horizontal")}
                                className={`function ${orientation === "horizontal" ? "selected" : ""}`}
                            >
                                Horizontal
                            </button>
                        </div>
                    </div>
                    {/* REPEAT */}
                    <div className="flex flex-col gap-2">
                        <h2>
                            Repeat:
                        </h2>
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => setRepeat(true)}
                                className={`function ${repeat === true ? "selected" : ""}`}
                            >
                                On
                            </button>
                            <button
                                onClick={() => {setRepeat(false); setNumRepeats(0)}}
                                className={`function ${repeat === false ? "selected" : ""}`}
                            >
                                Off
                            </button>
                        </div>
                        { repeat && (
                            <div className="flex flex-col gap-2">
                                <h2> Number of Repeats: </h2>
                                <input
                                    type="number"
                                    min="1"
                                    value={numRepeats === null ? 0 : numRepeats}
                                    onChange={(e) => setNumRepeats(Number(e.target.value))}
                                    className="function ml-4"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-2">
                <h2>
                    Editing:
                </h2>
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setEditing(true)}
                        className={`function ${editing === true ? "selected" : ""}`}
                    >
                        On
                    </button>
                    <button
                        onClick={() => setEditing(false)}
                        className={`function ${editing === false ? "selected" : ""}`}
                    >
                        Off
                    </button>
                </div>
            </div>
            <button 
                onClick={handleSavePattern}
                className="button"
            >
                Save Pattern
            </button>
        </aside>
    )
}