// Parse the Data
d3.csv("./ma_lga_12345.csv").then(function(data) {
    // Set the dimensions and margins of the graph
    const margin = {top: 40, right: 130, bottom: 100, left: 130},
        width = 1100 - margin.left - margin.right,
        height = 650 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select("#my_dataviz")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // Parse the date and convert MA to number
    const parseDate = d3.timeParse("%d/%m/%Y");
    data.forEach(d => {
        d.saledate = parseDate(d.saledate);
        d.MA = +d.MA;
    });

    // List of groups (make this variable so we can update it)
    let keys = ["unit_1", "unit_2", "unit_3", "house_2", "house_3", "house_4", "house_5"];
    
    const color_map = {
        "unit_1": "#005f73",
        "unit_2": "#0a9396",
        "unit_3": "#94d2bd",
        "house_2": "#e9d8a6",
        "house_3": "#ee9b00",
        "house_4": "#ca6702",
        "house_5": "#bb3e03"
    }

    // Color palette
    let color = d3.scaleOrdinal()
        .domain(keys)
        .range(keys.map(key => color_map[key]));

    // Prepare the data for stacking
    const groupedData = d3.nest()
        .key(d => d.saledate.getFullYear())
        .key(d => `${d.type}_${d.bedrooms}`)
        .rollup(v => d3.sum(v, d => d.MA))
        .entries(data);

    let stackData = groupedData.map(yearData => {
        const obj = {year: +yearData.key};
        yearData.values.forEach(typeData => {
            obj[typeData.key] = typeData.value;
        });
        keys.forEach(key => {
            if (!(key in obj)) obj[key] = 0;
        });
        return obj;
    });

    // Stack the data
    const stack = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys.slice().reverse());

    let layers = stack(stackData);
    

    // Add X axis
    const x = d3.scaleTime()
        .domain(d3.extent(stackData, d => new Date(d.year, 0)))
        .range([0, width]);
        
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear)
            .tickFormat(d3.timeFormat("%Y")))
        .style("font-size", "12px");

    // Add Y axis
    let y = d3.scaleLinear()
        .domain([d3.min(layers, layer => d3.min(layer, d => d[0]) * 1.2),
                 d3.max(layers, layer => d3.max(layer, d => d[1])) * 1.2])
        .range([height, 0]);
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")))
        .style("font-size", "12px");

    // Area generator with curve
    let area = d3.area()
        .curve(d3.curveBasis)
        .x(d => x(new Date(d.data.year, 0)))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    // Show the areas
    svg.selectAll("mylayers")
        .data(layers)
        .enter().append("path")
        .attr("d", area)
        .attr("fill", (d) => color(d.key))
        .attr("opacity", 0.8);

    // Add a draggable legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width + 50}, 0)`);

    const dragHandler = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    const legendItems = legend.selectAll(".legend-item")
        .data(keys)
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0,${i * 20})`)
        .call(dragHandler);

    legendItems.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legendItems.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(d => d)
        .style("font-size", "12px");
        
    // Create a function to update the visualization
    function updateVisualization() {
        // Update color scale domain
        color = d3.scaleOrdinal()
            .domain(keys)
            .range(keys.map(key => color_map[key]));
        
        // Recompute the stack with the new key order
        stack.keys(keys.slice().reverse());
        layers = stack(stackData);

        // Update area generator
        area = d3.area()
            .curve(d3.curveBasis)
            .x(d => x(new Date(d.data.year, 0)))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        svg.selectAll("path").remove();

        svg.selectAll("mylayers")
            .data(layers)
            .enter().append("path")
            .attr("d", area)
            .attr("fill", (d) => color(d.key))
            .attr("opacity", 0.8);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(d3.timeYear)
                .tickFormat(d3.timeFormat("%Y")))
            .style("font-size", "12px");

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format(".2s")))
            .style("font-size", "12px");

        // Update the legend order
        legend.selectAll(".legend-item")
            .data(keys)
            .transition()
            .duration(200)
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        // Update legend colors
        legend.selectAll("rect")
            .transition()
            .duration(200)
            .style("fill", d => color(d));
    }

    let draggedItem = null;

    function dragstarted(d) {
        draggedItem = d;
        d3.select(this).raise().classed("active", true);
    }

    function dragged(d) {
        const currentY = d3.event.y;
        d3.select(this).attr("transform", `translate(0,${currentY})`);

        const currentIndex = keys.indexOf(draggedItem);
        const itemHeight = 20; // Height of each legend item

        // Calculate the new index based on the current Y position
        let newIndex = Math.floor(currentY / itemHeight);
        newIndex = Math.max(0, Math.min(newIndex, keys.length - 1));

        if (newIndex !== currentIndex) {
            // Create a new array with the updated order
            const newKeys = keys.filter(k => k !== draggedItem);
            newKeys.splice(newIndex, 0, draggedItem);

            // Update the visual order of legend items
            legend.selectAll(".legend-item")
                .data(newKeys, d => d)
                .order()
                .transition()
                .duration(40)
                .attr("transform", (d, i) => `translate(0,${i * itemHeight})`);
            
        }
    }

    function dragended(d) {
        d3.select(this).classed("active", false);
        
        // Update the keys array with the final order
        keys = legend.selectAll(".legend-item").data();
        
        updateVisualization();
        draggedItem = null;
    }
});
