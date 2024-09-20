// set the size of svg
const width = 1080; const height = 720;
const margin = {top: 50, right: 60, bottom: 50, left: 120};
// set the inner size of chart
const innerWidth = width - margin.right - margin.left;
const innerHeight = height - margin.top - margin.bottom;

const dataset_path = "./abalone.data"
const header = ["Sex", "Length", "Diameter", "Height", "Whole weight", 
    "Shucked weight", "Viscera weight", "Shell weight", "Rings"]
const abalone_type = ['Male', 'Female', 'Infant'];
const heatmap_color = d3.scaleOrdinal()
    .domain(abalone_type)
    .range([["#eb0e2f", "#fff", "#0e20eb"], ['#8c6b07', '#fff', '#9e0e9c'], ["#460aa1", "#fff", "#128c07"]]);
// Calculate Correlation Matrix
// Helper function to calculate Pearson correlation
function pearsonCorrelation(x, y) {
    let meanX = d3.mean(x);
    let meanY = d3.mean(y);
    let numerator = d3.sum(x.map((d, i) => (d - meanX) * (y[i] - meanY)));
    let denominator = Math.sqrt(d3.sum(x.map(d => Math.pow(d - meanX, 2))) * d3.sum(y.map(d => Math.pow(d - meanY, 2))));
    return numerator / denominator;
}

// Compute the correlation matrix for a given dataset
function correlationMatrix(data_matrix) {
    // list of object contains attribute name and correlation coefficient
    let matrix = [];
    // put same attribute value in same row
    const attr_matrix = math.transpose(data_matrix);
    for(let row1 = 0; row1 < attr_matrix.length; row1++){
        for(let row2 = 0; row2 < attr_matrix.length; row2++){
            let corr = math.corr(attr_matrix[row1], attr_matrix[row2]);
            matrix.push({
                x_value: header[row1 + 1],
                y_value: header[row2 + 1],
                corr_value: +corr
            });
        }
    }
    return matrix;
}

// Visualizing with D3.js
function drawMatrix(corr_matrix, heatmap_color){
    // remove the previous plot (both legend and matrix)
    d3.select("#my_dataviz").select("svg").remove();
    // d3.select("#legend").select('svg').remove();

    // correlation matrix plot
    const svg = d3.select('#my_dataviz')
        .append('svg')
            .attr('width', width)
            .attr('height', height)
    const plotG = svg
        .append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

    let padding = .01;
    let x_scale = d3.scaleBand()
        .range([0, innerWidth])
        .paddingInner(padding)
        .domain(header.slice(1));

    let y_scale = d3.scaleBand()
        .range([0, innerHeight])
        .paddingInner(padding)
        .domain(header.slice(1));

    const color = d3.scaleLinear()
        .domain([-1, 0, 1])
        .range(heatmap_color);

    let x_axis = d3.axisTop(x_scale)
        .tickFormat(function(d, i){ return header[i+1]; });
    let y_axis = d3.axisLeft(y_scale)
        .tickFormat(function(d, i){ return header[i+1]; });

    plotG.append("g")
        .attr("class", "x axis")
        .call(x_axis)
        .attr('font-size', '12pt');

    plotG.append("g")
        .attr("class", "y axis")
        .call(y_axis)
        .attr('font-size', '12pt');

    rect = plotG.selectAll("rect")
        .data(corr_matrix)
        .enter()
    // plot each cell in matrix
    rect.append("rect")
            .attr("x", function(d){ return x_scale(d.x_value); })
            .attr("y", function(d){ return y_scale(d.y_value); })
            .attr("width", x_scale.bandwidth())
            .attr("height", y_scale.bandwidth())
            .style("fill", function(d){ return color(d.corr_value); })
            .style("opacity", 1e-6)
            .transition()
                .style("opacity", 1);
    // plot the coorelation value of each cell
    rect.append('text')
        .text(function(d){
            return d.corr_value.toFixed(2);
        })
        .attr("x", function(d){ return x_scale(d.x_value) + 55; })
        .attr("y", function(d){ return y_scale(d.y_value) + 45; })
        .attr('text-anchor', 'middle')
        // choose the text color according to the cell color
        .attr('fill', function(d){
            if(math.abs(d.corr_value) < 0.5) return 'black';
            else return 'white';
        })
        .attr('font-size', '15pt');
    // end of correlation matrix plot

    // legend plot
    let legend_top = 20;
    let legend_height = 15;

    let legend_svg = d3.select("#legend")
        .append("svg")
            .attr("width", width)
            .attr("height", legend_height + legend_top)
        .append("g")
            .attr("transform", "translate(" + margin.left + ", " + legend_top + ")");

    let defs = legend_svg.append("defs");

    let gradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");

    let stops = [{offset: 0, color: color(-1), value: -1}, {offset: .5, color: color(0), value: 0}, {offset: 1, color: color(1), value: 1}];
    
    gradient.selectAll("stop")
        .data(stops)
        .enter().append("stop")
        .attr("offset", function(d){ return (100 * d.offset) + "%"; })
        .attr("stop-color", function(d){ return d.color; });

    legend_svg.append("rect")
        .attr("width", innerWidth)
        .attr("height", legend_height)
        .style("fill", "url(#linear-gradient)");

    legend_svg.selectAll("text")
        .data(stops)
        .enter().append("text")
        .attr("x", function(d){ return innerWidth * d.offset; })
        .attr("dy", -3)
        .style("text-anchor", function(d, i){
            if(i == 0) return 'start';
            else if(i == 1) return 'middle';
            else return 'end';
        })
        .text(function(d, i){ return d.value.toFixed(1) + ""; })
}

// Load the dataset 
const dataset = [];
let maleCorrMatrix = [];
let femaleCorrMatrix = [];
let infantCorrMatrix = [];
const corr_mat_dict = {"male": maleCorrMatrix, "female": femaleCorrMatrix, "infant": infantCorrMatrix}

let csv_data = d3.text(dataset_path).then(function(data) {
    // Parse the data into a usable format
    let header_data = 'Sex,Length,Diameter,Height,Whole weight,Shucked weight,Viscera weight,Shell weight,Rings\n' + data;

    let maleData = [];
    let femaleData = [];
    let infantData = [];
    
    csv_data = d3.csvParse(header_data).forEach((row) => {
        // console.log(row);
        // numeric matrix for correlation calculation
        let tmp_row = [];
        // turn char to numeric type
        for(let idx = 1; idx < header.length; idx++){
            row[header[idx]] = +row[header[idx]];
            tmp_row.push(row[header[idx]]);
        }
        if(row['Sex'] == 'M') maleData.push(tmp_row);
        else if(row['Sex'] == 'F') femaleData.push(tmp_row);
        else if(row['Sex'] == 'I') infantData.push(tmp_row);
        dataset.push(row);
    })    

    // Calculate correlation matrices
    corr_mat_dict["male"] = correlationMatrix(maleData);
    corr_mat_dict["female"] = correlationMatrix(femaleData);
    corr_mat_dict["infant"] = correlationMatrix(infantData);


    drawMatrix(corr_mat_dict["male"], heatmap_color("male"));
    // Step 4: Interaction for Selecting Different Sexes
    // Add event listeners for the radio buttons
    d3.selectAll("input[name='sex']").on("change", function() {
        console.log(this.value);
        const selectedSex = this.value;
        drawMatrix(corr_mat_dict[selectedSex], heatmap_color(selectedSex));
    });
});
