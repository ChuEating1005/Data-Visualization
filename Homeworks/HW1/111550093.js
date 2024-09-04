let x_label = "sepal length"
let y_label = "sepal width"
let data = [];

//Read the data
d3.csv("./iris.csv", function(csvdata){
    data = csvdata
    scatter_plot(data)
})

function updateXaxis(){
    const selectedXaxis = document.getElementById("x_label").value;
    x_label = selectedXaxis
    scatter_plot()
}

function updateYaxis(){
    const selectedYaxis = document.getElementById("y_label").value;
    y_label = selectedYaxis
    scatter_plot()
}

function scatter_plot(){
    var margin = {top: 30, right: 130, bottom: 90, left: 130},
    width = 800 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;
    
    // remove the previous svg
    d3.select("#my_dataviz").select("svg").remove()

    // append the svg object to the body of the page
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let x_max = 0
    let y_max = 0
    let x_min = 100
    let y_min = 100
    for(let i = 0; i < data.length; i++) {
        if(data[i][x_label] > x_max) {
            x_max = data[i][x_label]
        }
        if(data[i][x_label] < x_min) {
            x_min = data[i][x_label]
        }
        if(data[i][y_label] > y_max) {
            y_max = data[i][y_label]
        }
        if(data[i][y_label] < y_min) {
            y_min = data[i][y_label]
        }
    }

    // Add X axis
    var x = d3.scaleLinear()
        .domain([Math.floor(x_min), Math.ceil(x_max)])
        .range([ 0, width ]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([Math.floor(y_min), Math.ceil(y_max)])
        .range([ height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    var color = d3.scaleOrdinal()
        .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
        .range(["#e63946", "#588157", "#457b9d"])

    var raddius = d3.scaleOrdinal()
        .domain(["Iris-setosa", "Iris-versicolor", "Iris-virginica"])
        .range([5, 6, 7])

    // Add X Label
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", width + 10)
        .attr("y", height + margin.top + 10)
        .text(x_label)
        .style("font-size", "17px")
    svg.append("text")
        .attr("text-anchor", "end")
        .attr("x", -40)
        .attr("y", 20)
        .text(y_label)
        .style("font-size", "17px")
    // svg.append("text")
    //     .attr("text-anchor", "end")
    //     .attr("transform", "rotate(-90)")
    //     .attr("x", 0)
    //     .attr("y", -margin.left + 50)
    //     .text(y_label)
    //     .style("font-size", "17px")
    

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
    
    // Add dots
    svg.append('g')
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) { return x(d[x_label]); } )
        .attr("cy", function (d) { return y(d[y_label]); } )
        .attr("r", function (d) {return raddius(d.class)} )
        .style("fill", function (d) {return color(d.class)} )
}