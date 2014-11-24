 /* ----------- Globals ------------------ */

var mapWidth = $("#map-container").width();
var mapHeight = $("#map-container").height();

var bounds, muni;


/* -------- Map ------------ */

var center = [38.6525642, -90.382851]; //Centered on St Louis



var map = new L.Map("map-container", {
    center: center,
    zoom: 10,
    minZoom: 4,
    maxZoom: 16,
    maxBounds: [[54,-63],[20,-126]]
})
    //.addLayer(new L.tileLayer('https://{s}.tiles.mapbox.com/v3/wsjgraphics.map-ie50n254/{z}/{x}/{y}.png'));
    .addLayer(new L.StamenTileLayer("toner-lite"));




var mapSvg = d3.select(map.getPanes().overlayPane).append("svg").attr("class", "mapSvg");

var transform = d3.geo.transform({
    point: projectPoint
}),
    path = d3.geo.path().projection(transform);


function projectPoint(x, y) {
    var point = map.latLngToLayerPoint(new L.LatLng(y, x));
    this.stream.point(point.x, point.y);
}


d3.selection.prototype.moveToFront = function () {
    return this.each(function () {
        this.parentNode.appendChild(this);
    });
};

d3.selection.prototype.moveToBack = function () {
    return this.each(function () {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};



/* ------------------------------- */
/* -------- INIT ------------- */
/* ------------------------------- */

$(document).ready(function() {

    queue()
        .defer(d3.json, "js/municipal_boundary.json")
        .await(setData);

});

/* ------------------------------- */



function setData(error, muniData) {
    muni = muniData;
    theMap.init();
}



var theMap = {
    init : function() {

        munies = mapSvg.append("g")
            .attr("class", "leaflet-zoom-hide");

        munies.selectAll("path")
            .data(muni.features)
          .enter().append("path")
            .attr("d", path)
            .attr("class", function(d) {
                return "cty";
            })
            .attr("fill", function(d) {
                return "999";
            })

        bounds = path.bounds(muni),
            topLeft = [(bounds[0][0] - 100), (bounds[0][1] - 100)],
            bottomRight = [(bounds[1][0] + 100), (bounds[1][1] + 100)];

        mapSvg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");

        munies.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        theMap.events();

        map.on("viewreset", function() {
            mapParams.set().then(mapParams.updateSvg);
        });


    },
    events : function() {
        d3.selectAll(".cty").on('mouseover', function (d) {
            var sel = d3.select(this);
            
            sel.classed("over", true)
                .moveToFront();
            
            tooltip(d);
                       
        })
        .on('mouseout', function () {
            $("#tt").hide();
            var sel = d3.select(this);

            sel.classed("over", false)
                .moveToBack();

        })
        .on("mousemove", function (d) {

            var pos = d3.mouse(this);

            // var xPos = projectStation([d.longitude, d.latitude]).x;
            // var yPos = projectStation([d.longitude, d.latitude]).y;

            var offsetLeft = $(".leaflet-map-pane").position().left;
            var offsetTop = $(".leaflet-map-pane").position().top;
            
            $("#tt").css({
                "top": pos[1] - $("#tt").height() - 40 + offsetTop,
                "left": pos[0] - ($("#tt").width()/2) + offsetLeft - 8
            });
        });
    }
}






/* ----------------------------------------------------------- */
/* -------- MAP UPDATE BOUNDS, ETC ------------- */
/* ----------------------------------------------------------- */

var mapParams = {
    set : function() {

        var dfd = $.Deferred();

        bounds = path.bounds(muni),
            topLeft = [(bounds[0][0] - 100), (bounds[0][1] - 100)],
            bottomRight = [(bounds[1][0] + 100), (bounds[1][1] + 100)];

        mapSvg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");
        
        munies.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        dfd.resolve();  
        return dfd.promise();

    },
    updateSvg: function() {
        d3.selectAll("path.cty")
            .attr("d", path);
    },
    resize : function() {
        map.invalidateSize();
    }
}
/* ----------------------------------------------------------- */













function tooltip(d) {

    var name = toTitleCase(d.properties.municipali);

    $("#tt").html(
        "<p class='stn-name'>"+name+"</p>"
    ).show();

}



function toTitleCase(str) {
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}


