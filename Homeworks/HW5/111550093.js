data = []
// Set dimensions and margins
d3.csv("times_world_university_rankings_2024.csv").then(function(loadedData) {

    console.log("Data loaded successfully:", loadedData);

    if (!loadedData || !Array.isArray(loadedData)) {
        console.error("Loaded data is not an array or is undefined:", loadedData);
        return;
    }

    // Assign loaded data
    data = loadedData;    

    // Process data: convert numeric fields to numbers
    data.forEach(function(d) {
        d.scores_teaching = +d.scores_teaching || 0;
        d.scores_research = +d.scores_research || 0;
        d.scores_citations = +d.scores_citations || 0;
        d.scores_industry_income = +d.scores_industry_income || 0;
        d.scores_international_outlook = +d.scores_international_outlook || 0;
        d.scores_overall = +d.scores_overall || 0;
    });
    // Filter out universities with all zero scores
    data = data.filter(function(d) {
        return d.scores_teaching !== 0 || d.scores_research !== 0 || d.scores_citations !== 0 ||
            d.scores_industry_income !== 0 || d.scores_international_outlook !== 0;
    });

    var margin = { top: 40, right: 0, bottom: 60, left: 200 },
        width = 1200 - margin.left - margin.right,
        stack_height = 15,
        height = Math.max(600, data.length * stack_height);  // Height dynamically adjusted
        
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

    function updateChart(){
        // Remove existing elements
        svg.selectAll('*').remove();

        // Add Y Axis with rotated labels
        svg.append("g")
            .call(d3.axisLeft(y).tickSizeOuter(0))
            .selectAll("text")
            .attr("transform", "translate(-10,0)")
            .style("font-size", "8px")
            .style("text-anchor", "end")
            .attr("dy", ".35em");
    
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
            .attr("height", y.bandwidth());
    
        //set legend
        svg.append("rect")
            .attr("x", -(margin.left) * 0.8)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#4e79a7")
        svg.append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left) * 0.8 + 20)
            .attr("y", -(margin.top / 2.5))
            .text("teaching")
        svg.append("rect")
            .attr("x", -(margin.left) * 0.8 + 100)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#f28e2c")
        svg.append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left) * 0.8 + 120)
            .attr("y", -(margin.top / 2.5))
            .text("research")
        svg.append("rect")
            .attr("x", -(margin.left) * 0.8 + 200)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#e15759")
        svg.append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left) * 0.8 + 220)
            .attr("y", -(margin.top / 2.5))
            .text("citations")
        svg.append("rect")
            .attr("x", -(margin.left) * 0.8 + 300)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#76b7b2")
        svg.append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left) * 0.8 + 320)
            .attr("y", -(margin.top / 2.5))
            .text("industry income")
        svg.append("rect")
            .attr("x", -(margin.left) * 0.8 + 450)
            .attr("y", -(margin.top / 2) - 5)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", "#59a14f")
        svg.append("text")
            .attr("class", "legend")
            .attr("x", -(margin.left) * 0.8 + 470)
            .attr("y", -(margin.top / 2.5))
            .text("international outlook")
    }

    // Function to sort data and update the chart
    function sortData() {
        // Get the selected sorting criterion and order
        var criterion = document.getElementById("sort-by").value;
        var order = document.getElementById("sort-order").value;
        console.log("Sorting by:", criterion, order);
        // Sort the data based on the selected criterion and order
        data.sort(function(a, b) {
        return order === "ascending" ? (b[criterion] - a[criterion]) : (a[criterion] - b[criterion]);
        });
        console.log("Sorted data:", data);
    
        // Update Y scale domain with the sorted data
        y.domain(data.map(function(d) { return d.name; }));
    
        // Update the bars in the chart
        updateChart();
    }

    function hideCriteria() {
        var criterion = document.getElementById("sort-by").value;
        var order = document.getElementById("sort-order").value;
        console.log("Sorting by:", criterion, order);
        // Sort the data based on the selected criterion and order
        data.sort(function(a, b) {
        return order === "ascending" ? (b[criterion] - a[criterion]) : (a[criterion] - b[criterion]);
        });
        console.log("Sorted data:", data);
    
        // Update Y scale domain with the sorted data
        y.domain(data.map(function(d) { return d.name; }));
    
        // Update the bars in the chart
        updateChart();
    }
});

