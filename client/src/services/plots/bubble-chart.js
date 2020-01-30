// import React, { Component } from 'react'
import * as d3 from 'd3'

export class BubbleChart {
    constructor(container, data) {
        console.log("bubble-chart service reached!");
        this.container = container;
        this.dataset =  data;
        this.drawBubbleChart(this.container, this.dataset);
        // this.componentDidMount();
    }
    // componentDidMount() {
    //      ...
    //     };
    //     this.drawBubbleChart(dataset)
    // }

    drawBubbleChart(container, dataset)  {
        console.log("data reached drawBubbleChart() d3", dataset);
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

        var nodes = d3.hierarchy(dataset)
            .sum(function(d) { return d.count; });

        var node = svg.selectAll(".node")
            .data(bubble(nodes).descendants())
            .enter()
            .filter(function(d){
                return !d.children
            })
            .append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + d.x + ", " + d.y + ")";
            });

        node.append("title")
            .text(function(d) {
                return d.title + ": " + d.count;
            });

        node.append("circle")
            .attr("r", function(d) {
                return d.r;
            })
            .style("fill", "orange");

        node.append("text")
            .attr("dy", ".2em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.title.substring(0, d.r / 3);
            })
            .attr("font-family", "sans-serif")
            .attr("font-size", function(d){
                return d.r/5;
            })
            .attr("fill", "white");

        node.append("text")
            .attr("dy", "1.3em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.data.count;
            })
            .attr("font-family",  "Gill Sans", "Gill Sans MT")
            .attr("font-size", function(d){
                return d.r/5;
            })
            .attr("fill", "white");
        
        node.on("click", function(e) {
            console.log("node clicked!", e);
            // d3.event.stopPropagation();
          });

        d3.select(container)
            .style("height", diameter + "px");

    }

}