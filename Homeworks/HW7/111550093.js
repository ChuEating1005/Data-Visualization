thresholds ={
    'SO2': {
        'good': 0.02,
        'normal': 0.05,
        'bad': 0.15,
        'very bad': 1.0
    },
    'NO2': {
        'good': 0.03,
        'normal': 0.06,
        'bad': 0.2,
        'very bad': 2.0
    },
    'CO': {
        'good': 2.0,
        'normal': 9.0,
        'bad': 15.0,
        'very bad': 50.0
    },
    'O3': {
        'good': 0.03,
        'normal': 0.09,
        'bad': 0.15,
        'very bad': 0.5
    },
    'PM10': {
        'good': 30.0,
        'normal': 80.0,
        'bad': 150.0,
        'very bad': 600.0
    },
    'PM2.5': {
        'good': 15.0,
        'normal': 35.0,
        'bad': 75.0,
        'very bad': 500.0
    }
}
const margin = { top: 20, right: 70, bottom: 30, left: 100 };
            const width = 900 - margin.left - margin.right;
            const height = 150 - margin.top - margin.bottom;

// Example CSV parsing using d3-dsv
d3.csv("http://vis.lab.djosix.com:2024/data/air-pollution.csv").then(data => {
    // Show loading text
    // Data Preparation: Aggregate hourly data into daily summaries
    function aggregateData(data) {
        const dailyData = {
            'SO2': {},
            'NO2': {},
            'O3': {},   
            'CO': {},
            'PM10': {},
            'PM2.5': {}
        };
        aggregatedDatas = {
            'SO2': {},
            'NO2': {},
            'O3': {},
            'CO': {},
            'PM10': {},
            'PM2.5': {}
        }
        pollutants = ['SO2', 'NO2', 'O3', 'CO', 'PM10', 'PM2.5'];

        data.forEach(entry => {
            const date = new Date(entry['Measurement date']);
            
            if (isNaN(date.getTime())) {
                console.error(`Invalid date encountered: ${entry['Measurement date']}`);
                return;
            }

            const dateString = date.toISOString().split('T')[0]; // Extract date
            for (let i = 0; i < pollutants.length; i++) {
                const key = `${entry['Station code']}_${pollutants[i]}_${dateString}`;

                if (!dailyData[pollutants[i]][key]) {
                    dailyData[pollutants[i]][key] = [];
                }
                dailyData[pollutants[i]][key].push(parseFloat(entry[pollutants[i]])); // Parse the value as a float
            }
           
        });

        for (let i = 0; i < pollutants.length; i++) {
            aggregatedDatas[pollutants[i]] = Object.entries(dailyData[pollutants[i]]).map(([key, values]) => {
                const [stationCode, pollutant, date] = key.split('_');
                const meanValue = values.reduce((a, b) => a + b, 0) / values.length; // Calculate mean
                return { stationCode, pollutant, date, value: meanValue };
            });
        }

        return aggregatedDatas;
    }

    // Horizon Chart Creation using D3.js
    function createHorizonCharts(data) {
        const uniqueCombinations = [...new Set(data.map(d => `${d.stationCode}-${d.pollutant}`))];

        d3.select("#my_dataviz").selectAll("*").remove(); // Clear the existing chart
        uniqueCombinations.forEach(combination => {
            const [stationCode, pollutant] = combination.split('-');
            const filteredData = data.filter(d => d.stationCode === stationCode && d.pollutant === pollutant);

            
            const svg = d3.select("#my_dataviz").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scaleTime()
                .domain(d3.extent(filteredData, d => new Date(d.date)))
                .range([0, width]);

            const maxValue = Math.min(d3.max(filteredData, d => d.value), thresholds[pollutant]['normal'] * 1.5);
            const y = d3.scaleLinear()
                .domain([0, maxValue])
                .range([height, 0]);

            const levels = 4; // Example for 4 levels
            const colorMap = {
                0: '#89CFF0',
                1: '#66FF00',
                2: '#FFEF00',
                3: '#FF3800'
            };

            const area = d3.area()
                .x(d => x(new Date(d.date)))
                .y0(height)
                .y1(d => y(d.value));

            // Horizon layering
            for (let i = 0; i < levels; i++) {
                svg.append("path")
                    .datum(filteredData)
                    .attr("fill", colorMap[i])
                    .attr("d", d3.area()
                        .x(d => x(new Date(d.date)))
                        .y0(height)
                        .y1(d => y(Math.max(0, d.value - (i * maxValue / levels))))
                    );
            }

            // Add axes
            svg.append("g")
                .attr("transform", `translate(0,${height})`)
                .call(d3.axisBottom(x));

            svg.append("g")
                .call(d3.axisLeft(y).ticks(5)); // Reduce the number of ticks on the y-axis

            // Add labels
            svg.append("text")
                .attr("x", 0 - margin.left + 40)
                .attr("y", 0 - margin.top / 2 + 60)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .text(`${stationCode}`);
        });
    }

    // Main function to execute the requirements
    function main(data) {
        const dataMap = aggregateData(data)
        d3.select("#loading").style("display", "none");
        createHorizonCharts(dataMap['SO2']);
        d3.selectAll("input[name='pollutant']").on("change", function() {
            console.log(this.value);
            const pollutant = this.value;
            createHorizonCharts(dataMap[pollutant]);
        });
    }
    main(data);
});

function openModal() {
    document.getElementById("modalBackground").style.display = "flex";
}

function closeModal() {
    document.getElementById("modalBackground").style.display = "none";
}