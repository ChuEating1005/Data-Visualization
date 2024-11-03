// Dimensions
const width = 1100;
const height = 750;
const margin = { top: 80, right: 200, bottom: 80, left: 20 }; // Increased right margin for legend
const header = ['buying', 'maint', 'doors', 'persons', 'lug_boot', 'safety', 'class'];
// Color scales - one for each category
const categoryColors = {
    buying: d3.scaleOrdinal()
        .domain(['vhigh', 'high', 'med', 'low'])
        .range(['#BD1039', '#EB194A', '#F26B8A', '#F7A0B4']),
    maint: d3.scaleOrdinal()
        .domain(['vhigh', 'high', 'med', 'low'])
        .range(['#CF390B', '#F35322', '#f78c6b', '#FBC2B1']),
    doors: d3.scaleOrdinal()
        .domain(['2', '3', '4', '5more'])
        .range(['#DE9B00', '#FFBA1A', '#ffd166', '#FFE7B1']),
    persons: d3.scaleOrdinal()
        .domain(['2', '4', 'more'])
        .range(['#036666', '#469d89', '#99e2b4']),
    lug_boot: d3.scaleOrdinal()
        .domain(['small', 'med', 'big'])
        .range(['#01497c', '#61a5c2', '#a9d6e5']),
    safety: d3.scaleOrdinal()
        .domain(['low', 'med', 'high'])
        .range(['#6247aa', '#9163cb', '#c19ee0'])
};
const format = d3.format(",.0f");
const formatRatio = d3.format(".1%");

// Create the Sankey generator
const sankey = d3.sankey()
    .nodeWidth(20)
    .nodePadding(35)
    .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

// Create the link path generator
const link = d3.sankeyLinkHorizontal();

// Load data from CSV file
d3.text("./car.data").then(rawData => {
    // Create SVG
    const svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create a group for the Sankey diagram
    const sankeyGroup = svg.append("g");

    // Create tooltip
    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Add headers to the data
    const headerData = 'buying,maint,doors,persons,lug_boot,safety,class\n' + rawData;
    const formattedData = d3.csvParse(headerData);

    // Process data for Sankey diagram
    const graph = processData(formattedData);
    
    // Apply the Sankey layout
    sankey(graph);

    // Calculate total flow for percentages
    const totalFlow = graph.nodes.find(n => n.name.startsWith('buying:')).value;

    // Add links
    const linkGroup = sankeyGroup.append("g")
        .selectAll(".link")
        .data(graph.links)
        .join("path")
        .attr("class", "link")
        .attr("d", link)
        .attr("fill", "none")
        .attr("stroke", d =>{
            const category = d.source.name.split(":")[0];
            const value = d.source.name.split(":")[1];
            return categoryColors[category](value);
        })
        .attr("stroke-opacity", 0.5)
        .style("stroke-width", d => Math.max(1, d.width) * 0.8)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("stroke-opacity", 1);
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(
                `${d.source.name} → ${d.target.name}<br/>` +
                `Count: ${format(d.value)}<br/>` +
                `Ratio: ${formatRatio(d.value / totalFlow)}`
            )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .attr("stroke-opacity", 0.5);
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add nodes
    const nodeGroup = sankeyGroup.append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x0},${d.y0})`)
        .call(d3.drag()
            .subject(function(event, d) {
                return d;
            })
            .on("start", function(event, d) {
                this.parentNode.appendChild(this);
            })
            .on("drag", function(event, d) {
                const rectHeight = d.y1 - d.y0;
                d.y0 = Math.max(0, Math.min(height - rectHeight, event.y));
                d.y1 = d.y0 + rectHeight;
                d3.select(this)
                    .attr("transform", `translate(${d.x0},${d.y0})`);
                sankey.update(graph);
                linkGroup.attr("d", link);
            }));

    // Add node rectangles
    nodeGroup.append("rect")
        .attr("height", d => d.y1 - d.y0)
        .attr("width", d => d.x1 - d.x0)
        .attr("fill", d => {
            const category = d.name.split(":")[0];
            const value = d.name.split(":")[1];
            return categoryColors[category](value);
        })
        .attr("stroke", "#000");

    // Add node labels
    nodeGroup.append("text")
        .attr("x", d => (d.x0 < width / 2) ? (d.x1 - d.x0 + 6) : -6)
        .attr("y", d => (d.y1 - d.y0) / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", d => (d.x0 < width / 2) ? "start" : "end")
        .text(d => d.name.split(":")[1]);

    // Add top bar to show each node class name
    const topbar = svg.append("g")
         .attr("transform", `translate(${margin.left}, ${margin.top - 10})`);

    topbar.selectAll("text")
        .data(graph.nodes)
        .enter()
        .append("text")
        .attr("x", d => d.x0 + (d.x1 - d.x0) / 2 - 20)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .attr("font-size", "18px")
        .text(d => d.name.split(":")[0]);

    

    // Add legends
    const legendGroup = svg.append("g")
        .attr("transform", `translate(${width - margin.right + 100}, ${margin.top })`);

    Object.entries(categoryColors).forEach(([category, colorScale], index) => {
        const categoryGroup = legendGroup.append("g")
            .attr("transform", `translate(0, ${index * 110})`);

        categoryGroup.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .attr("font-weight", "bold")
            .text(category);

        const legendItems = categoryGroup.selectAll(".legend-item")
            .data(colorScale.domain())
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("rect")
            .attr("x", 0)
            .attr("width", 15)
            .attr("height", 15)
            .attr("fill", d => colorScale(d));

        legendItems.append("text")
            .attr("x", 20)
            .attr("y", 12)
            .text(d => d);
    });
});

function processData(data) {
    // Create arrays to store unique nodes and links
    const nodes = new Map();
    const links = new Map();
    
    // Helper function to create a unique key for links
    const getLinkKey = (source, target) => `${source}|${target}`;
    
    // Process each row of data
    data.forEach(row => {
        const attributes = ['buying', 'maint', 'doors', 'persons', 'lug_boot', 'safety'];
        
        // Create nodes and links for each consecutive pair of attributes
        for (let i = 0; i < attributes.length - 1; i++) {
            const sourceAttr = attributes[i];
            const targetAttr = attributes[i + 1];
            
            const sourceName = `${sourceAttr}:${row[sourceAttr]}`;
            const targetName = `${targetAttr}:${row[targetAttr]}`;
            
            // Add nodes if they don't exist
            if (!nodes.has(sourceName)) {
                nodes.set(sourceName, { name: sourceName });
            }
            if (!nodes.has(targetName)) {
                nodes.set(targetName, { name: targetName });
            }
            
            // Create or update link
            const linkKey = getLinkKey(sourceName, targetName);
            const existingLink = links.get(linkKey);
            
            if (existingLink) {
                existingLink.value += 1;
            } else {
                links.set(linkKey, {
                    source: sourceName,
                    target: targetName,
                    value: 1
                });
            }
        }
    });

    // Convert nodes and links to arrays
    const nodesArray = Array.from(nodes.values());
    const linksArray = Array.from(links.values()).map(link => ({
        source: nodesArray.findIndex(node => node.name === link.source),
        target: nodesArray.findIndex(node => node.name === link.target),
        value: link.value
    }));

    return {
        nodes: nodesArray,
        links: linksArray
    };
}