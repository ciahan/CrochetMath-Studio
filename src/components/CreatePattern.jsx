import { useState } from "react";

export default function CreatePattern ({ 
    onCreate, 
    onImport,
    mathStudio,
}) {
    const [rows, setRows] = useState(20);
    const [cols, setCols] = useState(41);
    
    return (
        <div className="flex flex-col p-6 gap-10">
            <div className="flex flex-col gap-4">
                { mathStudio ? (
                    <div className="flex flex-col gap-2">
                        <h1> Create an Overlay Mosaic Crochet Pattern in the Math Studio </h1>
                        <p> Enter the dimensions for the repeat of the function. The number of repeats can be adjusted in the Math Studio </p>
                    </div>
                ) : (
                    <h1>
                        Create a Blank Overlay Mosaic Crochet Pattern
                    </h1>
                )}
                <label>
                    Number of rows:
                    <input
                        type="number"
                        min="1"
                        value={rows}
                        onChange={(e) => setRows(Number(e.target.value))}
                        className="function ml-4"
                    />
                </label>
                <label>
                    Number of columns:
                    <input
                        type="number"
                        min="1"
                        value={cols}
                        onChange={(e) => setCols(Number(e.target.value))}
                        className="function ml-4"
                    />
                </label>

                <button 
                    onClick={() => onCreate(rows, cols)}
                    className="button self-center"
                >
                    Create Pattern
                </button>
            </div>
            
            { mathStudio ? (
                <></>
            ) : (
                <div className="flex flex-col gap-4">
                    <h1>
                        Import an Overlay Mosaic Crochet Pattern
                    </h1>

                    <label
                        className="button self-center"
                    >
                        Import an Overlay Mosaic Crochet Pattern
                        <input 
                            type="file"
                            accept=".json"
                            onChange={onImport}
                            className="fileInput"
                        />
                    </label>
                </div>
            )}
        </div>
    )
}