
import * as d3 from "d3";
import { queue } from "d3-queue";
import { geoMercator, geoConicEquidistant } from "d3-geo";
import * as topojson from "topojson";

const sizeRatio = 0.5;
const mapScale = 0.7;
const offset = 50;

class InvestmentMap {

    constructor(container)
    {
        const $container = d3.select(container);
        const size = $container.node().getBoundingClientRect();
        const width = size.width - offset;
        const height = width * sizeRatio;
        const scale = width * mapScale;

        const projection = geoConicEquidistant()
            .rotate([-105, 0])
            .center([-10, 65])
            .scale(scale)
            .translate([width / 2, height / 2 ]);

        this.path = d3.geoPath().projection(projection);
        this.svg = $container
                        .append("svg")
                            .attr("width", width)
                            .attr("height", height);

        const renderMap = (err, geo, data) => this.init(geo, data);

        queue()
            .defer(d3.json, "data/geo/russia.topo.json")
            .defer(d3.json, "data/finance/by-regions.json")
            .await(renderMap);
    }

    init(geo, data) {

        const regions = topojson.feature(geo, geo.objects.regions).features;

        this.svg
            .append("g")
            .selectAll("path")
            .data(regions)
                .enter()
                    .append("path")
                    .attr("d", this.path);
    }
}

export default InvestmentMap;