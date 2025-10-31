// Load the data
const socialMedia = d3.csv("socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 50, right: 30, bottom: 50, left: 50};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#boxplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const ageGroups = [...new Set(data.map(d => d.AgeGroup))];
    const xScale = d3.scaleBand()
        .domain(ageGroups)
        .range([0, width])
        .paddingInner(0.3)
        .paddingOuter(0.2);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Likes)])
        .nice()
        .range([height, 0]);

    // Add x-axis label
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Age Group");

    // Add y-axis label
    svg.append("g")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -35)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Number of Likes");

    function rollupFunction(values) {
        const sorted = values.slice().sort((a, b) => a - b);
        const q1 = d3.quantile(sorted, 0.25);
        const median = d3.quantile(sorted, 0.5);
        const q3 = d3.quantile(sorted, 0.75);
        const min = d3.min(sorted);
        const max = d3.max(sorted);
        return { q1, median, q3, min, max };
    }

    // Calculate quantiles by AgeGroup
    const quantilesByGroups = d3.rollup(
        data,
        v => rollupFunction(v.map(d => d.Likes)),
        d => d.AgeGroup
    );

    // Loop through each AgeGroup to draw boxplots
    quantilesByGroups.forEach((quantiles, ageGroup) => {
        const x = xScale(ageGroup);
        const boxWidth = xScale.bandwidth();

        // Draw vertical lines
        svg.append("line")
            .attr("x1", x + boxWidth / 2)
            .attr("x2", x + boxWidth / 2)
            .attr("y1", yScale(quantiles.min))
            .attr("y2", yScale(quantiles.max))
            .attr("stroke", "black");

        // Draw box
        svg.append("rect")
            .attr("x", x)
            .attr("y", yScale(quantiles.q3))
            .attr("width", boxWidth)
            .attr("height", Math.max(0, yScale(quantiles.q1) - yScale(quantiles.q3)))
            .attr("fill", "#69b3a2");

        // Draw median line
        svg.append("line")
            .attr("x1", x)
            .attr("x2", x + boxWidth)
            .attr("y1", yScale(quantiles.median))
            .attr("y2", yScale(quantiles.median))
            .attr("stroke", "black");
    });
});

// Side-by-side grouped barplot
const socialMediaAvg = d3.csv("socialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(d => {
      d.AvgLikes = +d.AvgLikes;
    });

    // Define the dimensions and margins for the SVG
    const margin = {top: 50, right: 30, bottom: 70, left: 60};
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#barplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Derive domains from data
    const platforms = [...new Set(data.map(d => d.Platform))];
    const postTypes = [...new Set(data.map(d => d.PostType))];

    // Add scales x0, x1, and y
    const x0 = d3.scaleBand()
        .domain(platforms)
        .range([0, width])
        .paddingInner(0.2);

    const x1 = d3.scaleBand()
        .domain(postTypes)
        .range([0, x0.bandwidth()])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);

    // Color scale for PostType
    const color = d3.scaleOrdinal()
        .domain(postTypes)
        .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    // Add x-axis label
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x0));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 50)
        .attr("text-anchor", "middle")
        .text("Platform");

    // Add y-axis label
    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Average Likes");

    // Group container for bars
    // One group per platform
    const barGroups = svg.selectAll(".platform-group")
      .data(platforms)
      .enter()
      .append("g")
      .attr("class", "platform-group")
      .attr("transform", platform => `translate(${x0(platform)},0)`);

    // Draw bars
    barGroups.selectAll("rect")
        .data(platform => data.filter(d => d.Platform === platform))
        .enter()
        .append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType));

    // Add the legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, ${margin.top - 20})`);

    postTypes.forEach((type, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(type));

      legend.append("text")
        .attr("x", 22)
        .attr("y", i * 20 + 12)
        .text(type)
        .attr("alignment-baseline", "middle");
    });
});

// Line plot over time
const socialMediaTime = d3.csv("socialMediaTime.csv");

socialMediaTime.then(function(data) {
    data.forEach(d => {
      // Convert string values to numbers
      d.AvgLikes = +d.AvgLikes;
      // Convert Date string to JS Date object (keep only mm/dd/yyyy)
      d.DateParsed = d3.timeParse("%m/%d/%Y")(d.Date.split(" ")[0]);
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 50, right: 50, bottom: 80, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("#lineplot")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Set up scales for x and y axes
    const xScale = d3.scaleTime()
        .domain(d3.extent(data, d => d.DateParsed))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.AvgLikes)])
        .nice()
        .range([height, 0]);

    // Draw the axis, you can rotate the text in x-axis here
    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%m/%d"));
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("transform", "rotate(-25)");

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .attr("text-anchor", "middle")
        .text("Date");

    // Add y-axis label
    svg.append("text")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Average Likes");

    // Draw the line and path. Remember to use curveNatural.
    const line = d3.line()
        .x(d => xScale(d.DateParsed))
        .y(d => yScale(d.AvgLikes))
        .curve(d3.curveNatural);

    // Add path
    svg.append("path")
        .datum(data)
        .attr("fill", "none")
        .attr("stroke", "#1f77b4")
        .attr("stroke-width", 2)
        .attr("d", line);
});


