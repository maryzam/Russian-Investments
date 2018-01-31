
import * as d3 from "d3";
import { queue } from "d3-queue";
import { geoMercator, geoConicEquidistant } from "d3-geo";
import * as topojson from "topojson";

const sizeRatio = 0.5;
const mapScale = 0.7;
const offset = 50;
const defaultInfo = { Receive: 0, Invest: 0, Delta: 0 };

const arrayToObject = (array, key) =>
    array.reduce((obj, item) => {
            obj[item[key]] = item;
            return obj;
        }, {});

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
            .translate([width / 2, height / 2]);

        this.year = "2009";
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

    init(geo, finance) {

        const regions = topojson.feature(geo, geo.objects.regions).features;
        const investments = finance.Years.find((d) => (d.Year + "" === this.year));
        const financeLookup = arrayToObject(investments.Regions, "RegionCode");

        const max = investments.Regions.reduce((res, curr) => Math.max(res, curr.Delta), 0);
        const min = investments.Regions.reduce((res, curr) => Math.min(res, curr.Delta), 0);
        const colorScale = d3.scaleLinear()
                                .domain([max, 0, min])
                                .range(["#d73027", "#fee08b", '#1a9850'])
                                .interpolate(d3.interpolateHcl);

        regions.forEach((r) => {
            let info = financeLookup[r.properties.OKATO];
            if (!info) {
                info = defaultInfo;
            }
                r.properties["receive"] = info.Receive;
                r.properties["invest"] = -info.Invest;
                r.properties["delta"] = info.Delta;
        });
     
        this.svg
            .append("g")
            .selectAll("path")
            .data(regions)
                .enter()
                    .append("path")
                        .attr("d", this.path)
                        .style("fill", (d) => { return colorScale(d.properties.delta)});
    }
}

export default InvestmentMap;