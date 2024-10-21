// Parse the date and convert MA to number
const parseDate = d3.timeParse("%d/%m/%Y");
d3.csv("./ma_lga_12345.csv", d => {
    return {
        date: parseDate(d.saledate),
        MA: +d.MA,
        type: d.type,
        bedrooms: +d.bedrooms
    };
}).then(function(data) {
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
        
    const types = Array.from(new Set(data.map(d => d.type)));
    const bedroomsList = Array.from(new Set(data.map(d => d.bedrooms))).sort((a, b) => a - b);
    let keys = [];
    types.forEach(type => {
        bedroomsList.forEach(bedrooms => {
            const exists = data.some(d => d.type === type && d.bedrooms === bedrooms);
            if (exists) {
                keys.push(`${type}_${bedrooms}`);
            }
        });
    });
    
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
    const groupedData = d3.group(data, d => d.date);
    
    const stackData = [];

    groupedData.forEach((values, key) => {
        const obj = { date: key };
        values.forEach(v => {
            const k = `${v.type}_${v.bedrooms}`;
            obj[k] = (obj[k] || 0) + v.MA;
        });
        stackData.push(obj);
    });

    stackData.forEach(d => {
        keys.forEach(key => {
            if (!d[key]) {
                d[key] = 0;
            }
        });
    });
    stackData.sort((a, b) => a.date - b.date);


    // Stack the data
    const stack = d3.stack()
        .offset(d3.stackOffsetSilhouette)
        .keys(keys.slice().reverse());

    let layers = stack(stackData);
    console.log(layers);

    // Add X axis
    const x = d3.scaleTime()
        .domain(d3.extent(stackData, d => d.date))
        .range([0, width]);
        
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(d3.timeYear)
            .tickFormat(d3.timeFormat("%Y")))
        .style("font-size", "12px");

    // Add Y axis
    let y = d3.scaleLinear()
        .domain([d3.min(layers, layer => d3.min(layer, d => d[0])),
                 d3.max(layers, layer => d3.max(layer, d => d[1]))])
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

    // 在定义 area 生成器之前添加这些调试语句
    console.log("X domain:", x.domain());
    console.log("Y domain:", y.domain());

    // 修改 area 生成器如下
    area = d3.area()
        .curve(d3.curveBasis)
        .x(d => {
            const xValue = x(d.data.date);
            if (isNaN(xValue)) {
                console.error("Invalid x value:", d.data.date);
                return 0;
            }
            return xValue;
        })
        .y0(d => {
            const y0Value = y(d[0]);
            if (isNaN(y0Value)) {
                console.error("Invalid y0 value:", d[0]);
                return height;
            }
            return y0Value;
        })
        .y1(d => {
            const y1Value = y(d[1]);
            if (isNaN(y1Value)) {
                console.error("Invalid y1 value:", d[1]);
                return height;
            }
            return y1Value;
        });

    // 在使用 area 生成器之前，添加这个调试循环
    layers.forEach((layer, i) => {
        layer.forEach((d, j) => {
            if (isNaN(d[0]) || isNaN(d[1]) || !(d.data.date instanceof Date)) {
                console.error(`Invalid data point in layer ${i}, index ${j}:`, d);
            }
        });
    });

    // Create a tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");

    // Show the areas
    let layer = svg.selectAll(".layer")
        .data(layers)
        .enter().append("path")
        .attr('class', 'layer area')
        .attr("d", area)
        .attr("fill", (d) => color(d.key))
        .attr("opacity", 0.8)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

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
            .x(d => x(d.data.date))
            .y0(d => y(d[0]))
            .y1(d => y(d[1]));

        const layerSelection = svg.selectAll('.layer')
            .data(layers, d => d.key);

        layerSelection.exit().remove();

        const newLayer = layerSelection.enter()
            .append("path")
            .attr('class', 'layer area')
            .attr("d", area)
            .attr("fill", (d) => color(d.key))
            .attr("opacity", 0.8);
        
        const mergedLayer = newLayer.merge(layerSelection);

        mergedLayer.transition()
            .duration(500)
            .attr('d', area);

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

    function dragstarted(event, d) {
        draggedItem = d;
        d3.select(this).raise().classed("active", true);
    }

    function dragged(event, d) {
        const currentY = event.y;
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

    function dragended(event, d) {
        d3.select(this).classed("active", false);
        
        // Update the keys array with the final order
        keys = legend.selectAll(".legend-item").data();
        
        updateVisualization();
        draggedItem = null;
    }

    function mouseover(event, d) {
        tooltip.style("opacity", 1);
        d3.select(this).attr("opacity", 1);
    }

    function mousemove(event, d) {
        const [xPos, yPos] = d3.pointer(event, this);
        const date = x.invert(xPos);
        const bisectDate = d3.bisector(d => d.date).left;
        const index = bisectDate(stackData, date);
        const selectedData = stackData[index];

        const tooltipContent = `
            <strong>Date: ${d3.timeFormat("%B %Y")(selectedData.date)}</strong><br>
            Stream: ${d.key}<br>
            Price: $${d3.format(",.0f")(selectedData[d.key])}<br>
        `;

        tooltip.html(tooltipContent)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
    }

    function mouseleave(event, d) {
        tooltip.style("opacity", 0);
        d3.select(this).attr("opacity", 0.8);
    }
});
