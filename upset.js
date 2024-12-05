const plotUpset = (data, soloSets, plotId) => {

  if(soloSets.length == 0){
    return;
  }

  // all sets
  const allSetNames = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.substr(0, soloSets.length).split('');

  // position and dimensions
  const margin = {
    top: 20,
    right: 0,
    bottom: 300,
    left: 150,
  };
  const width = 40 * data.length;
  const height = 400;
  
  // make the canvas
  const svg = createSVG(plotId, width, height, margin, soloSets);

  // make a group for the upset circle intersection things
  const rad = 13;

  //create group for the labels and bars of the set
  createSetLabelsAndBars(plotId, svg, height, rad, soloSets);

  // sort data decreasing
  data.sort((a, b) => parseFloat(b.num) - parseFloat(a.num));

  //Create group for vertical bars representing intersection size
  const bars = createIntersectionBars(svg, rad, data, height, width);

  // circles
  const upsetCircles = svg.append('g')
    .attr('id', 'upsetCircles')
    .attr('transform', `translate(20,${height + 40})`);

  createCircles(data, allSetNames, rad, upsetCircles);

  //tool tip for intersection verticalbars
  createToolTipIntersectionBars(plotId, bars);

};

const createSVG = (plotId, width, height, margin, soloSets) => {
  return d3.select(`#${plotId}`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom + soloSets.length * 30) // Adjust height based on solo sets
    .attr('xmlns', 'http://www.w3.org/2000/svg')
    .attr('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    .attr('class', 'plot')
    .append('g')
    .attr('transform',
      `translate(${margin.left},${margin.top})scale(0.75)`)

    .attr('fill', 'white');

};

const createSetLabelsAndBars = (plotId, svg, height, rad, soloSets) => {
  const maxNumberElementsInSet = d3.max(soloSets, d => d.num);
  //add length of set name 
  const soloSetsWithLengths = soloSets.map(d => ({ name: d.name, length: d.name.length }));


  // Find the maximum length
  const maxLength = d3.max(soloSetsWithLengths, d => d.length);

  // create auxiliarWord to accomodate non alphanumeric characters
  const auxiliarWord = new Array(maxLength).join( 'A' );

  const textWidth = getTextWidth(auxiliarWord, 15); // Scale font size
  const maxRange = 150;

  // Create a linear scale for the bars' width based on the maximum number of elements
  const setBarScale = d3.scaleLinear()
    .domain([0, maxNumberElementsInSet])
    .range([0, maxRange]);

  const switchedScale = d3.scaleLinear()
    .domain([0, maxNumberElementsInSet])
    .range([maxRange, 0]);

  // Set labels group with scaling
  const setLabelsGroup = svg.append('g')
    .attr('id', 'setLabelsGroup')
    .attr('transform', `translate(-${textWidth + 30 }, ${height + 40})`);

  // Bars group with scaling
  const barsGroup = svg.append('g')
    .attr('id', 'barsGroup')
    .attr('transform', `translate(-${textWidth + setBarScale(maxNumberElementsInSet) + 30}, ${height + 40})`);

  // Add labels to the setLabelsGroup
  soloSets.forEach((x, i) => {
    setLabelsGroup.append('text')
      .attr('dx', 0)
      .attr('dy', 5 + i * (rad * 2.7))
      .attr('text-anchor', 'start')
      .attr('fill', '#3C4856')
      .style('font-size', `15px`)
      .text(x.name);
  });

  // Tooltip for set size bars
  let tooltipBars = d3.select(`#${plotId}`)
  .append('div')
  .style('position', 'absolute')
  .style('z-index', '10')
  .style('visibility', 'hidden')
  .style("background-color", '#02577b')
  .style("color", "white")
  .style("border-width", "2px")
  .style("border-radius", "5px")
  .style("padding", "5px")
  .style("font-size", `14px`)     // Set font size
  .style("font-weight", "normal");

  // Add bars to the barsGroup
  soloSets.forEach((x, i) => {
    barsGroup.append('rect')
      .attr('x', maxRange - setBarScale(x.num) - 10)
      .attr('y', i * (rad * 2.7) - rad / 2)
      .attr('width', setBarScale(x.num))
      .attr('height', rad)
      .attr('fill', '#02577b')
      .on("mouseover", (d) => {
        tooltipBars.html(`${x.name}: ${x.num} elements`).style('visibility', 'visible');;
      })
      .on("mousemove",() => {
        tooltipBars.style('top', `${d3.event.pageY - 10}px`).style('left', `${d3.event.pageX + 20}px`);      })

      .on("mouseout", () => {
        tooltipBars.style('visibility', 'hidden');
      });
  });

  // Create an axis based on the bar scale
  barsGroup.append("g")
    .attr("transform", `translate(-10, ${soloSets.length * rad * 2.7 - rad})`)
    .call(d3.axisBottom(switchedScale).ticks(5))
    .selectAll("text")
    .style('font-size', `14px`)
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end");

  // Set size label
  barsGroup.append("g")
    .append('text')
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", maxRange / 2)
    .attr("y", soloSets.length * rad * 2.7 + rad * 2)
    .attr("fill", "#3C4856")
    .style('font-size', `15px`)
    .text("Set Size");
};



const createIntersectionBars = (svg, rad, data, height, width ) => {
  // make the bars
  const upsetBars = svg.append('g')
    .attr('id', 'upsetBars');


  const nums = data.map((x) => x.num);

  // set range for data by domain, and scale by range
  const xrange = d3.scaleLinear()
    .domain([0, nums.length])
    .range([0, width]);

  const yrange = d3.scaleLinear()
    .domain([0, d3.max(nums)])
    .range([height, 0]);

  // set axes for graph
  const xAxis = d3.axisBottom()
    .scale(xrange)
    .tickPadding(2)
    .tickFormat((d, i) => data[i].setName)
    .tickValues(d3.range(data.length));

  const yAxis = d3.axisLeft()
    .scale(yrange)
    .tickSize(5);

  // add X axis
  upsetBars.append('g')
    .attr('class', 'x axis')
    .attr('transform', `translate(0,${height})`)
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .call(xAxis)
    .selectAll('.tick')
    .remove();

  // Add the Y Axis
  upsetBars.append('g')
    .attr('class', 'y axis')
    .attr('fill', 'none')
    .attr('stroke', 'black')
    .attr('stroke-width', 1)
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#3C4856')
    .attr('stroke', 'none')
    .style('font-size', `15px`); // This line increases the Y-axis label size

  // Add the Intersection Set Size label
  upsetBars.append("g")
    .append('text')
    .attr("class", "x label")
    .attr("text-anchor", "middle")
    .attr("x", -(height / 2))
    .attr("y", -40)
    .attr("fill", "#3C4856")
    .style('font-size',  `14px`)
    .text("Intersection Set Size")
    .attr("transform", "rotate(-90)");

  const chart = upsetBars.append('g')
    .attr('transform', 'translate(1,0)')
    .attr('id', 'chart');

  // adding each bar
  const bars = chart.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('width', 20)
    .attr('x', (d, i) => 9 + i * (rad * 2.7))
    .attr('y', (d) => yrange(d.num))
    .style('fill', '#02577b')
    .attr('height', (d) => height - yrange(d.num));
  return bars
};


const createCircles = (data, allSetNames, rad, upsetCircles) => {
  data.forEach((x, i) => {
    allSetNames.forEach((y, j) => {
      upsetCircles.append('circle')
        .attr('cx', i * (rad * 2.7))
        .attr('cy', j * (rad * 2.7))
        .attr('r', rad)
        .attr('class', `set-${x.setName}`)
        .style('opacity', 1)
        .attr('fill', x.setName.indexOf(y) !== -1 ? '#02577b' : 'silver');
    });

    upsetCircles.append('line')
      .attr('id', `setline${i}`)
      .attr('x1', i * (rad * 2.7))
      .attr('y1', allSetNames.indexOf(x.setName[0]) * (rad * 2.7))
      .attr('x2', i * (rad * 2.7))
      .attr('y2', allSetNames.indexOf(x.setName[x.setName.length - 1]) * (rad * 2.7))
      .style('stroke', '#02577b')
      .attr('stroke-width', 4);
});
};



const createToolTipIntersectionBars = (plotId, bars) => {
  // tooltip
  const tooltip = d3.select(`#${plotId}`)
    .append('div')
    .style('position', 'absolute')
    .style('z-index', '10')
    .style('visibility', 'hidden')
    .style("background-color", '#02577b')
    .style("color", "white")
    .style("border-width", "2px")
    .style("border-radius", "5px")
    .style("padding", "5px")
    .style("font-size", `14px`)     // Set font size
    .style("font-weight", "normal");


  bars.on('mouseover', (d) => {
    let result = d.name.includes('∩', 0);
    if (result === true) {
      tooltip.html(`${d.name}: ${d.num} element${d.num === 1 ? '' : 's'}`).style('visibility', 'visible');
    } else {
      tooltip.html(`${d.name}: ${d.num} unique element${d.num === 1 ? '' : 's'}`).style('visibility', 'visible');
    }

  })
    .on('mousemove', () => {
      tooltip.style('top', `${d3.event.pageY - 20}px`).style('left', `${d3.event.pageX + 20}px`);
    })
    .on('mouseout', () => {
      tooltip.style('visibility', 'hidden');
      // Reset bar style


    });

};

function getTextWidth(text, fontSize = 15) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = `${fontSize}px sans-serif`;
  return context.measureText(text).width;
}