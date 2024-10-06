origin_data = []
data = []
// Set dimensions and margins
d3.csv("times_world_university_rankings_2024.csv").then(function(loadedData) {

    console.log("Data loaded successfully:", loadedData);

    if (!loadedData || !Array.isArray(loadedData)) {
        console.error("Loaded data is not an array or is undefined:", loadedData);
        return;
    }

    // Process data: convert numeric fields to numbers
    for (let i = 0; i < loadedData.length; i++) {
        if (loadedData[i]["rank"] != "Reporter") {
            origin_data.push({
                "name": loadedData[i]["name"],
                "scores_overall": +loadedData[i]["scores_overall"].split("–")[0],
                "scores_teaching": +loadedData[i]["scores_teaching"],
                "scores_research": +loadedData[i]["scores_research"],
                "scores_citations": +loadedData[i]["scores_citations"],
                "scores_industry_income": +loadedData[i]["scores_industry_income"],
                "scores_international_outlook": +loadedData[i]["scores_international_outlook"],
            })
        }
    }
    // Filter out universities with all zero scores
    origin_data = origin_data.filter(function(d) {
        return d.scores_teaching !== 0 || d.scores_research !== 0 || d.scores_citations !== 0 ||
            d.scores_industry_income !== 0 || d.scores_international_outlook !== 0;
    });
    data = origin_data;
    var margin = { top: 40, right: 0, bottom: 60, left: 200 },
        width = 1200 - margin.left - margin.right,
        stack_height = 15,
        height = data.length * stack_height;  // Height dynamically adjusted
        
    // Append SVG to #my_dataviz
    var svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    // Set up scales
    var y = d3.scaleBand()
        .domain(data.map(function(d) { return d.name; }))
        .range([0, height])
        .padding(0.2);  // Increased padding

    var x = d3.scaleLinear()
        .domain([0, 100])  // Assuming scores are between 0 and 100
        .range([0, width/6]);

    // Tooltip
    var tooltip = d3.select("#my_dataviz")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "#f9f9f9")
        .style("padding", "8px")
        .style("border", "1px solid #d3d3d3")
        .style("border-radius", "4px");

    const sort_button = document.querySelector("#sort");
    sort_button.addEventListener("change", sortData);

    init();

    function init() {
        data.sort(function(a, b) {
            return b.scores_overall - a.scores_overall;
        });
      
        // Update Y scale domain with the sorted data
        y.domain(data.map(function(d) { return d.name; }));
        console.log("Initial data:", data);
            
        // Update the bars in the chart
        updateChart();
    }
    function createLegend(){
        legend = svg.append("g")
            .attr("transform", "translate(-" + margin.left + ",0)");
        //set legend
        legend.append("rect")
            .attr("x", 0)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#4e79a7")
        legend.append("text")
            .attr("class", "legend")
            .attr("x", 20)
            .attr("y", -(margin.top / 2.5))
            .text("Teaching")
        legend.append("rect")
            .attr("x", 100)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#f28e2c")
        legend.append("text")
            .attr("class", "legend")
            .attr("x", 120)
            .attr("y", -(margin.top / 2.5))
            .text("Research")
        legend.append("rect")
            .attr("x", 200)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#e15759")
        legend.append("text")
            .attr("class", "legend")
            .attr("x", 220)
            .attr("y", -(margin.top / 2.5))
            .text("Citations")
        legend.append("rect")
            .attr("x", 300)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#76b7b2")
        legend.append("text")
            .attr("class", "legend")
            .attr("x", 320)
            .attr("y", -(margin.top / 2.5))
            .text("Industry Income")
        legend.append("rect")
            .attr("x", 450)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#59a14f")
        legend.append("text")
            .attr("class", "legend")
            .attr("x", 470)
            .attr("y", -(margin.top / 2.5))
            .text("International Outlook")
    }

    function updateChart() {
        // Remove previous bars and other elements
        svg.selectAll('*').remove();
    
        // Add Y Axis with rotated labels
        svg.append("g")
            .call(d3.axisLeft(y).tickSizeOuter(0))
            .selectAll("text")
            .attr("transform", "translate(-10,0)")
            .style("font-size", "8px")
            .style("text-anchor", "end")
            .attr("dy", ".35em");
    
        const activeSubgroups = ["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"];
    
        // Tooltip functions
        const mouseover = function(event, d) {
            tooltip.style("opacity", 1);
            
            // Highlight all bars of the same criterion
            var criterionClass = "bar-" + d3.select(this.parentNode).datum().key;
            d3.selectAll("." + criterionClass)
                .style("opacity", 1);
            for (var i = 0; i < activeSubgroups.length; i++) {
                if (activeSubgroups[i] !== d3.select(this.parentNode).datum().key) {
                    d3.selectAll(".bar-" + activeSubgroups[i])
                        .style("opacity", 0.3);
                }
            }
        };
    
        const mousemove = function(event, d) {
            var total = d3.sum(activeSubgroups.map(function(key){ return d.data[key]; }));
            var text = activeSubgroups.map(function(key){
                return criteriaNames[key] + ": " + d.data[key];
            }).join("<br>");
            tooltip
                .html("<strong>" + d.data.name + "</strong><br>" + text + "<br>Total: " + total.toFixed(2))
                .style("left", (event.pageX + 20) + "px")
                .style("top", (event.pageY - 20) + "px");
        };
    
        const mouseleave = function(event, d) {
            tooltip.style("opacity", 0);
            
            // Remove highlighting
            var criterionClass = "bar-" + d3.select(this.parentNode).datum().key;
            d3.selectAll("." + criterionClass)
                .style("opacity", 1);
            for (var i = 0; i < activeSubgroups.length; i++) {
                if (activeSubgroups[i] !== d3.select(this.parentNode).datum().key) {
                    d3.selectAll(".bar-" + activeSubgroups[i])
                        .style("opacity", 0.9);
                }
            }
        };
    
        // Set color for different categories
        var color = d3.scaleOrdinal()
            .domain(["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"])
            .range(d3.schemeCategory10);
    
        // Stack the data for bars
        var subgroups = ["scores_teaching", "scores_research", "scores_citations", "scores_industry_income", "scores_international_outlook"];
        var stackedData = d3.stack()
            .keys(subgroups)(data);
        
        console.log("Stacked Data:", stackedData);
    
        // Create a group for each set of stacked bars
        svg.append("g")
            .selectAll("g")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("fill", function(d) { return color(d.key); })
            .selectAll("rect")
            .data(function(d) { return d; })
            .enter()
            .append("rect")
                .attr("y", function(d) { return y(d.data.name); })
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", function(d) { return x(d[1]) - x(d[0]); })
                .attr("height", y.bandwidth())
                .attr("class", function(d, i, nodes) { 
                    return "bar-" + d3.select(nodes[i].parentNode).datum().key; // Add class based on criterion
                })
                .style("opacity", 0.9)
                .on("mouseover", mouseover)
                .on("mousemove", mousemove)
                .on("mouseleave", mouseleave);
    
        // Add text labels on the left side of each bar
        svg.append("g")
            .selectAll("g")
            .data(stackedData)
            .enter()
            .append("g")
            .attr("fill", function(d) { return color(d.key); })
            .selectAll("text")
            .data(function(d) { return d; })
            .enter().append("text")
                .attr("y", function(d) { return y(d.data.name) + y.bandwidth() / 2; })
                .attr("x", function(d) { return x(d[0]) + 15; }) // Positioning text to the left of the bar
                .attr("dy", ".35em")
                .attr("text-anchor", "end")
                .style("font-size", "10px")
                .style("fill", "#eee") // Optional: set text color
                .text(function(d) { return Math.floor(d[1] - d[0]); }); // Display the value of the criterion
    
        // Create legend
        createLegend();
    }
    

    // Function to sort data and update the chart
    function sortData() {
        // Get the selected sorting criterion and order
        var criterion = document.getElementById("sort-by").value;
        var order = document.getElementById("sort-order").value;
        var top_n = document.getElementById("top-n").value;
        
        console.log("Sorting by:", criterion, order);
        // Sort the data based on the selected criterion and order
        origin_data.sort(function(a, b) {
            return order === "ascending" ? (a[criterion] - b[criterion]) : (b[criterion] - a[criterion]);
        });
        console.log("Sorted data:", origin_data);
        data = origin_data.slice(0, top_n);

        // Update Y scale domain with the sorted data
        y.domain(data.map(function(d) { return d.name; }));
        
        height = data.length * stack_height;
        d3.select("#my_dataviz").select("svg").remove();
        svg = d3.select("#my_dataviz")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
        y = d3.scaleBand()
            .domain(data.map(function(d) { return d.name; }))
            .range([0, height])
            .padding(0.2);  // Increased padding
    
        x = d3.scaleLinear()
            .domain([0, 100])  // Assuming scores are between 0 and 100
            .range([0, width/6]);
        // Update the bars in the chart
        updateChart();
    }
});

