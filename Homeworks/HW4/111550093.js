// Global variables
var margin = {top: 30, right: 50, bottom: 100, left: 60},
    width = 1000 - margin.left - margin.right,
    height = 1000 - margin.top - margin.bottom,
    cellwidth = width / 5, cellheight = height / 5,
    cellposx = width / 4, cellposy = height / 4,
    gridSize = 20, gridColor = "#dfdfdf";
let data = [];
const attributes = ["sepal length", "sepal width", "petal length", "petal width"];
const translation = {"sepal length": 0, "sepal width": 1, "petal length": 2, "petal width": 3};
var brushCell; // Keeps track of the active brush cell
var selectedIds = []; // Keeps track of selected data point IDs
var color = d3.scaleOrdinal()
    .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
    .range(["#e63946", "#588157", "#457b9d"]);
var raddius = d3.scaleOrdinal()
    .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
    .range([4.5, 4.5, 4.5]);

d3.csv("./iris.csv", function(error, csvdata) {
    csvdata = csvdata.filter(function(d) {
        return d["sepal length"] && d["sepal width"] && d["petal length"] && d["petal width"] && d.class;
    });
    data = csvdata;
    if (error) throw error;

    data = csvdata.map(function(d, i) {
        return {
            "sepal length": +d["sepal length"],
            "sepal width": +d["sepal width"],
            "petal length": +d["petal length"],
            "petal width": +d["petal width"],
            "class": d["class"],
            "id": i  // Assign unique ID
        };
    });

    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        .property("value", []);

    matrix_plot(svg);

    // Add legend
    // Setosa
    svg.append("circle")
        .attr("cx", width / 2 - 150)
        .attr("cy", height + margin.top + 45)
        .attr("r", 5)
        .style("fill", "#e63946")
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2 - 115)
        .attr("y", height + margin.top + 50)
        .text("Setosa")
        .style("fill", "#e63946")
        .style("font-size", "20px")
    // Versicolor
    svg.append("circle")
        .attr("cx", width / 2 - 50)
        .attr("cy", height + margin.top + 45)
        .attr("r", 6)
        .style("fill", "#588157")
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.top + 50)
        .text("Versicolor")
        .style("fill", "#588157")
        .style("font-size", "20px")
    // Virginica
    svg.append("circle")
        .attr("cx", width / 2 + 70)
        .attr("cy", height + margin.top + 45)
        .attr("r", 7)
        .style("fill", "#457b9d")
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2 + 115)
        .attr("y", height + margin.top + 50)
        .text("Virginica")
        .style("fill", "#457b9d")
        .style("font-size", "20px")
});


function matrix_plot(svg) {
    attributes.forEach(function(x_label) {
        attributes.forEach(function(y_label) {
            if (x_label != y_label) {
                scatter_plot(svg, x_label, y_label);
            } else {
                histogram_plot(svg, x_label);
            }
        });
        // X axis label
        svg.append("text")
            .attr("x", Math.floor(translation[x_label] * cellposx) + cellwidth / 2 - 10)
            .attr("y", 0)
            .style("font-size", "20px")
            .text(x_label);
        // Y axis label
        svg.append("text")
            .attr("x", Math.floor((3 - translation[x_label]) * cellposx) + cellwidth / 2 - 40)
            .attr("y", 0)
            .attr("transform", "translate(-20," + width + ") rotate(-90)")
            .style("font-size", "20px")
            .text(x_label);
    });
}

function histogram_plot(svg, x_label){
    // append the svg object to the body of the page
    let x_max = 0
    let x_min = 100
    for(let i = 0; i < data.length; i++) {
        if(data[i][x_label] > x_max) {
            x_max = data[i][x_label]
        }
        if(data[i][x_label] < x_min && data[i][x_label]) {
            x_min = data[i][x_label]
        }
    }
    var upleft_x = Math.floor(translation[x_label] * cellposx + 30)
    var upleft_y = Math.floor(translation[x_label] * cellposy + 30)

    var cell = svg.append("g")
        .attr("transform", "translate(" + upleft_x + "," + upleft_y + ")")

    // X axis: scale and draw:
    var x = d3.scaleLinear()
        .domain([Math.floor(x_min), Math.ceil(x_max)])
        .range([0, cellwidth]);
    cell.append("g")
        .attr("transform", "translate(0," + cellheight + ")")
        .call(d3.axisBottom(x).ticks(6));

    // set the parameters for the histogram
    var histogram = d3.histogram()
        .value(function(d) { return d[x_label]; })   // I need to give the vector of value
        .domain(x.domain())  // then the domain of the graphic
        .thresholds(x.ticks(15)); // then the numbers of bins

    // And apply this function to data to get the bins
    var bins = histogram(data);
    

    // Y axis: scale and draw:
    var y = d3.scaleLinear()
        .range([cellheight, 0])
        .domain([0, d3.max(bins, function(d) { return d.length; })]);   // d3.hist has to be called before the Y axis obviously
    cell.append("g")
        .call(d3.axisLeft(y).ticks(5));

    // append the bar rectangles to the svg element
    cell.selectAll("rect")
        .data(bins)
        .enter()
        .append("rect")
            .attr("x", 1)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { return Math.max(x(d.x1) - x(d.x0) -1,0) ; })
            .attr("height", function(d) { return cellheight - y(d.length); })
            .style("fill", "#69b3a2")
    
    graw_grid(cell)
}

function scatter_plot(svg, x_label, y_label) {
    let x_max = d3.max(data, d => d[x_label]);
    let y_max = d3.max(data, d => d[y_label]);
    let x_min = d3.min(data, d => d[x_label]);
    let y_min = d3.min(data, d => d[y_label]);

    let upleft_x = Math.floor(translation[x_label] * cellposx + 30);
    let upleft_y = Math.floor(translation[y_label] * cellposy + 30);

    var cell = svg.append("g")
        .attr("transform", "translate(" + upleft_x + "," + upleft_y + ")");

    // Add X axis
    var x = d3.scaleLinear()
        .domain([x_min, x_max])
        .range([0, cellwidth]);
    cell.append("g")
        .attr("transform", "translate(0," + cellheight + ")")
        .call(d3.axisBottom(x).ticks(6));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([y_min, y_max])
        .range([cellheight, 0]);
    cell.append("g")
        .call(d3.axisLeft(y).ticks(5));

    // Add dots with common class
    var circles = cell.append('g')
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "dot")  // Assign common class
        .attr("cx", function (d) { return x(d[x_label]); })
        .attr("cy", function (d) { return y(d[y_label]); })
        .attr("r", function (d) { return raddius(d.class); })
        .style("fill", function (d) { return color(d.class); })
        .style("opacity", 0.75);

    // Initialize the brush
    brush(cell, circles, svg, x_label, y_label, x, y, data);

    // Grid background
    graw_grid(cell);
}

// Brush function
function brush(cell, circle, svg, x_label, y_label, x, y, data) {
    // brushCell and selectedIds are global variables

    var brush = d3.brush()
        .extent([[0, 0], [cellwidth, cellheight]])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    cell.append("g")
        .attr("class", "brush")
        .call(brush);

    // Clear the previously-active brush, if any.
    function brushstarted() {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.move, null);  // Clear the previous brush
            brushCell = this;  // Set the current cell as active
        }
    }

    function brushed() {
        if (!circle) return;

        var selection = d3.event.selection;
        if (selection) {
            var x0 = selection[0][0],
                y0 = selection[0][1],
                x1 = selection[1][0],
                y1 = selection[1][1];

            selectedIds = [];

            circle.each(function(d) {
                var cx = x(d[x_label]),
                    cy = y(d[y_label]);
                var isSelected = x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;

                if (isSelected) {
                    selectedIds.push(d.id);
                }
            });

            updateCircles();
        } else {
            selectedIds = [];
            updateCircles();
        }
    }

    function brushended() {
        var selection = d3.event.selection;
        if (!selection) {
            selectedIds = [];
            updateCircles();
        }
    }
}

// Function to update the styling of all circles based on selection
function updateCircles() {
    d3.selectAll('.dot')
        .style('fill', function(d) {
            if (selectedIds.length === 0) {
                return color(d.class);  // Reset to original color
            } else {
                return selectedIds.indexOf(d.id) !== -1 ? color(d.class) : '#aaa';
            }
        })
        .attr('r', function(d) {
            if (selectedIds.length === 0) {
                return raddius(d.class);  // Reset to original color
            } else {
                return selectedIds.indexOf(d.id) !== -1 ? raddius(d.class) : 3.5;
            }
        });
}


function graw_grid(cell) {
    for (let x = 0; x <= cellwidth; x += gridSize) {
        for (let y = 0; y <= cellheight; y += gridSize) {
            cell.append("rect")
                .attr("x", x)
                .attr("y", y)
                .attr("width", gridSize)
                .attr("height", gridSize)
                .style("fill", "none")
                .style("stroke", gridColor)
                .style("stroke-width", 0.5)
                .lower();
        }
    }
}
