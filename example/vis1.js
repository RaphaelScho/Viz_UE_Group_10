// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel;
// radar chart axes
let radarAxes, radarAxesAngle;

let dimensions = ["dimension 1", "dimension 2", "dimension 3", "dimension 4", "dimension 5", "dimension 6"];
//*HINT: the first dimension is often a label; you can simply remove the first dimension with
// dimensions.splice(0, 1);

// the visual channels we can use for the scatterplot
let channels = ["scatterX", "scatterY", "size"];

let data;

// size of the plots
let margin, width, height, radius;
// svg containers
let scatter, radar;

let xScale, yScale, dotSizeScale;

const numberOfSpiderGridlines = 7;
const dotSize = {min: 0, max: 10}

let xValue = d => d[readMenu('scatterX')]
let yValue = d => d[readMenu('scatterY')]
let dotSizeValue = d => d[readMenu('size')]

function init() {
    // define size of plots
    margin = {top: 20, right: 20, bottom: 20, left: 50}
    width = 600
    height = 500
    radius = width / 2
    innerHeight = height - margin.top - margin.bottom
    innerWidth = width - margin.left - margin.right

    // scatterplot SVG container and axes
    scatter = d3.select("#sp").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    // radar chart SVG container and axes
    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");


    // read and parse input file
    let fileInput = document.getElementById("upload"),
        readFile = function () {

            if(fileInput.files[0]) {

                // clear existing visualizations
                clear();

                let reader = new FileReader();
                reader.onloadend = function () {
                    console.log("data loaded: ");
                    console.log(reader.result);
                    data = d3.csvParse(reader.result, d3.autoType);
                    initVis();
                };
                reader.readAsBinaryString(fileInput.files[0]);

            }
        };
    fileInput.addEventListener('change', readFile);

    readFile();
    initVis();
}

function initVis() {

    console.assert(data.length, 'The loaded dataset is empty');
    dimensions = Object.keys(data[0]);

    // y scalings for scatterplot
    yScale = d3.scaleLinear()
        .domain(d3.extent(data, yValue))
        .range([innerHeight, margin.top]);

    // x scalings for scatter plot
    xScale = d3.scaleLinear()
        .domain(d3.extent(data, xValue))
        .range([margin.left, innerWidth]);

    //scalings for size of dot
    dotSizeScale = d3.scaleSqrt()
        .domain([0,d3.max(data,dotSizeValue)])
        .range([0,dotSize.max]);


    // radius scalings for radar chart
    // TODO: set radius domain for each dimension
    let r = d3.scaleLinear()
        .domain([0, 1]) //TODO: our data have different scales, we will normalize the data instead?
        .range([0, radius]);

    // radar chart axes
    radarAxesAngle = Math.PI * 2 / dimensions.length;
    let axisRadius = d3.scaleLinear()
        .range([0, radius]);
    let maxAxisRadius = 0.75,
        textRadius = 0.8;
    let gridRadius = 0.1;

    // radar axes
    radarAxes = radar.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis");

    radarAxes.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => radarX(axisRadius(maxAxisRadius), i))
        .attr("y2", (d, i) => radarY(axisRadius(maxAxisRadius), i))
        .attr("class", "line")
        .style("stroke", "black");

    let polygon = (numberOfSides, radius) => d3.line()
        .x(d => radarX(radius, d))
        .y(d => radarY(radius, d))
        ([...Array(numberOfSides + 1).keys()])

    //draw gridlines in spidergraph
    for (let i = 1; i <= numberOfSpiderGridlines; ++i) {
        radar.append("path")
            .attr("d", polygon(dimensions.length, axisRadius(i * maxAxisRadius / numberOfSpiderGridlines)))
            .attr("stroke", "#d9d9d9")
            .attr("fill", "none")
    }

    // TODO: render correct axes labels
    radar.selectAll(".axisLabel")
        .data(dimensions)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => radarX(axisRadius(textRadius), i))
        .attr("y", (d, i) => radarY(axisRadius(textRadius), i) +
            ([0, Math.PI].includes(radarAngle(i)) ? 15 : 0))//move text down so it doesn't overlap with horizontal axes
        .attr('font-size', '1.5em')
        .text(d => d);

    // init menu for the visual channels
    channels.forEach(function (c) {
        initMenu(c, dimensions.slice(1))
    });

    // refresh all select menus
    channels.forEach(function (c) {
        refreshMenu(c);
    });

    renderScatterplot();
    renderRadarChart();

}

// clear visualizations before loading a new file
function clear() {
    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
}


function renderScatterplot() {

    //update domains
    xScale = xScale.domain(d3.extent(data, xValue))
    yScale = yScale.domain(d3.extent(data, yValue))
    dotSizeScale = dotSizeScale.domain([0,d3.max(data,dotSizeValue)])

    //remove old axes, create new ones
    scatter.selectAll(".axis").remove();

    xAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + innerHeight + ")")
        .call(d3.axisBottom(xScale));

    yAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ")")
        .call(d3.axisLeft(yScale));

    //axis labels
    xAxisLabel = xAxis.append('text')
        .style("text-anchor", "middle")
        .attr("x", margin.left + innerWidth / 2)
        .attr("y", margin.bottom / 2 + 25)
        .text(readMenu('scatterX'))
        .attr('font-size', '2em')

    yAxisLabel = yAxis.append('text')
        .text(readMenu('scatterY'))
        .style("text-anchor", "middle")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left / 2 - 12)
        .attr('transform', `rotate(-90)`)
        .attr('font-size', '2em')

    //render dots
    scatter.selectAll('circle').data(data)
          .attr('cx', d => xScale(xValue(d)))
          .attr('cy', d => yScale(yValue(d)))
          .attr('r',  d => dotSizeScale(dotSizeValue(d)))
          .attr("fill-opacity", "0.4")
        .enter().append('circle')
          .attr('cx', d => xScale(xValue(d)))
          .attr('cy', d => yScale(yValue(d)))
          .attr('r',  d => dotSizeScale(dotSizeValue(d)))
          .attr("fill-opacity", "0.4")
        .exit().remove()
}

function renderRadarChart() {

    // TODO: show selected items in legend

    // TODO: render polylines in a unique color
}

function radarX(radius, index) {
    return radius * Math.cos(radarAngle(index));
}

function radarY(radius, index) {
    return radius * Math.sin(radarAngle(index));
}

function radarAngle(index) {
    return radarAxesAngle * index - Math.PI / 2;
}


// init scatterplot select menu
function initMenu(id, entries) {
    $("select#" + id).empty();

    entries.forEach(function (d) {
        $("select#" + id).append("<option>" + d + "</option>");
    });

    $("#" + id).selectmenu({
        select: function () {
            renderScatterplot();
        }
    });
}

// refresh menu after reloading data
function refreshMenu(id) {
    $("#" + id).selectmenu("refresh");
}

// read current scatterplot parameters
function readMenu(id) {
    return $("#" + id).val();
}