export default function About () {
    return (
        <div className="page">
            <h1> About CrochetMath Studio and the Scarf that Inspired this Project </h1>
            <div className="flex flex-col items-center">
                <img 
                    src="/CrochetMath-Studio/SineWaveScarf.jpeg"
                    style={{ height: "300px", width: "auto" }}
                />
            </div>
            <p> 
                This project started in 9th grade math class, with a project about expressing
                mathematical concepts through art. The assignment's open-endedness allowed
                me to use crochet as a medium, hence the birth of the Sine Wave Scarf
                (as shown above).
            </p>
            <p>
                The Sine Scarf was made using only two colors of yarn, gray and blue. 
                Blue yarn was used for the background, while gray yarn was used for
                the actual sine wave. The scarf was made using the mosaic crochet technique,
                with a bobble-stitch twist to better represent the plotting of the points
                on the sine wave. Simply put, I made one bobble-stitch in the place of
                each gray double-crochet stitch that typically is used in overlay mosaic
                crochet. Back then, I was still rather new to mosaic crochet, and I
                made the decision to subject myself to weaving the ends of each row
                (in total, 100+ stray strands of yarn.) Not only did my novice end-weaving
                skills create inconsistent tension, making the scarf look uneven, I also
                wasted hours of time. Knowing what I know now about mosaic crochet, I
                definitely would have left the ends as is, or made a handy double border!
            </p>
            <h1> How to Use: </h1>
            <p>
                Create a pattern diagram either using the Math Studio, or the Pattern-Maker,
                with the tools in the Pattern Editor sidebar. View the actual pattern 
                instructions for each row by clicking on the row-header, as shown below.
            </p>
            <div className="flex flex-col items-center">
                <img 
                    src="/CrochetMath-Studio/RowPatternInstructions.png"
                    style={{ height: "500px", width: "auto" }}
                />
            </div>
            <h1> Future Plans: </h1>
            <p>
                I have many plans for renovations to the CrochetMath Studio in the future.
                For example, I want crocheters to be able to click on each component of the
                pattern in the row, for example, "sc" or "2 dc", to highlight the 
                corresponding stitches in the pattern diagram.
            </p>
            <p>
                I also want to allow an option to toggle the bobble-stitch method on,
                making changes to the pattern and diagram directly. As of current, the
                bobble-stitch method works well for functions displayed vertically, but not
                those displayed horizontally. This is because of the differences in the 
                way that the functions are graphed based on the selected orientation.
                While vertical functions are graphed by passing in the column-value and 
                plotting the correpsonding row-value, horizontal functions are graphed
                using by passing in the row-values, and plotting the corresponding the
                corresponding column-values. Thus, replacing each double crochet in gray 
                with a bobble-stitch doesn't work directly, because there may be
                multiple double crochets next to each other. 
            </p>
            <p>
                Finally, I have plans to expand the CrochetMath Studio to create more 
                crochet tools beyond just mosaic crochet. I am envisioning a pattern-diagram
                maker for dollies using traditional stitch representations, and using
                math to calculate whether the number of stitches in each row is approximately
                enough to ensure the dolly stays flat. More ambitiously, I want to 
                create an algorithm that can turn basic 3D models into crochet patterns.
            </p>
        </div>
    )
}