import * as d3 from 'd3'

export class BubbleChart {
    constructor(container, realData, handleSingleClick, handleDoubleClick, handleBackgroundDoubleClick) {
        // console.log("bubble-chart service reached!", realData);
        this.container = container;
        this.handleSingleClick = handleSingleClick;
        this.handleDoubleClick = handleDoubleClick;
        this.handleBackgroundDoubleClick = handleBackgroundDoubleClick
        if (realData && realData.length > 0) {
            this.realDataset = {
                children: realData
            };
            this.drawBubbleChart(this.container, this.realDataset, this.handleSingleClick, this.handleDoubleClick, this.handleBackgroundDoubleClick);
        }
    }

    drawBubbleChart(container, dataset, handleSingleClick, handleDoubleClick, handleBackgroundDoubleClick) {
        // console.log("data reached drawBubbleChart() d3", dataset);

        d3.selectAll(".bubble")
            .remove()

        var diameter = 800;
        // var color = d3.scaleOrdinal(d3.schemeCategory20);

        var bubble = d3.pack(dataset)
            .size([diameter, diameter])
            .padding(1.5);

        var svg = d3.select(container)
            .append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble");


        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", diameter)
            .attr("height", diameter)
            .style("fill", "white")
            .style("opacity", "0%")
            .on("click", function() { 
                d3.selectAll(".node")
                    .select(".circle")
                    .style("opacity", function (d) {
                        return "100%";
                    });
            })
            .on("dblclick", function() {
                handleBackgroundDoubleClick();
            });

        var nodes = d3.hierarchy(dataset)
            .sum(function (d) {
                // return d.count; 
                return 100;
            });

        // find a way to only output first level of tree as nodes
        var node = svg.selectAll(".node")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function (d) {
                // console.log("d", d);
                // return !d.children
                return d.depth === 1;
            })
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + d.x + ", " + d.y + ")";
            });

        node.append("title")
            .text(function (d) {
                // return d.data.title + ": " + d.data.count;
                return d.data.title + ": " + "100";
            });

        node.append("circle")
            .attr("r", function (d) {
                return d.r;
            })
            .style("fill", function (d) {
                // console.log("d", d);
                // color leaf bubbles #007bff
                return d.children ? "orange" : "#007bff";
            })
            .attr("class", "circle");

        node.append("text")
            .attr("dy", ".2em")
            .style("text-anchor", "middle")
            // .style("user-select", "none")
            .text(function (d) {
                // console.log("d.r", d.r);
                // do someting clever to prevent text overflow here
                return d.data.title.substring(0, d.r / 3);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", function (d) {
                return d.r / 6;
            })
            .attr("fill", "white");

        node.append("text")
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            // .style("user-select", "none")
            .text(function (d) {
                // return d.data.count;
                return 100;
            })
            .attr("font-family", "Gill Sans", "Gill Sans MT")
            .attr("font-size", function (d) {
                return d.r / 5;
            })
            .attr("fill", "white");

        node.on("click", function (e) {
            // console.log("node clicked!", e);
            d3.selectAll(".circle")
                .style("opacity", function (d) {
                    return "50%";
                });
            d3.selectAll(".node")
                .filter(function (d) {
                    // console.log("!", d, e, d === e);
                    return d === e;
                })
                .select(".circle")
                .style("opacity", function (d) {
                    return "100%";
                });
            handleSingleClick(e);
        });

        node.on("dblclick", function (e) {
            // console.log("node double-clicked!", e);
            handleDoubleClick(e);
        });

        d3.select(container)
            .style("height", diameter + "px");

    }

}