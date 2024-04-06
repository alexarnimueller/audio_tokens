class AudioGraph {

    constructor(data, parentId, audioContainerId, buttonContainerId = '',
        draw_edges = true, trial_id = '', width = 400, nextURL = '',
        loop = true, num_speakers = 1, isJsPsych = true) {

        this.num_items = data.nodes.length;
        this.nodes = data.nodes
        this.parentId = parentId
        this.audioContainerId = audioContainerId
        this.buttonContainerId = buttonContainerId
        this.draw_edges = draw_edges
        this.trial_id = trial_id
        this.opacity = 1.0
        this.loop = loop
        this.num_speakers = num_speakers
        this.nextURL = nextURL
        if (isJsPsych) {
            this.buttonClass = "jspsych-btn"
            this.submitResults = submitResultsJsPsych
        } else {
            this.buttonClass = "btn btn-primary"
            this.submitResults = submitResults
        }

        // const AudioContext = window.AudioContext || window.webkitAudioContext;
        // this.audioCtx = new AudioContext();

        this.width = width // document.getElementById(parentId).clientWidth
        this.height = this.width
        // document.getElementById(parentId).height = this.width
        this.max_len = Math.sqrt(this.width ** 2 * 2) * .5

        this.h = this.width / 2
        this.k = this.width / 2
        this.r = this.width / 2 - 30

        this.play = true

        this.style = {
            'border_width_1': 1,
            'border_width_2': 5,
            'border_color_1': 'black',
            'border_color_2': 'rgba(0,0,0,0.35)'
        }
        this.edge_on_hover = false

        // load audio
        this.setupAudio()

    }

    circle_size_1(self, d) {
        return 10
    }

    circle_size_2(self, d) {
        return self.circle_size_1(self, d) + 2
    }

    getStrokeOn() {
        var stroke = 'rgba(0,0,0,1)'
        var stroke_width = 1
        return [stroke, stroke_width]
    }

    getStrokeOff() {
        var stroke = 'rgba(0,0,0,0)'
        var stroke_width = 1
        return [stroke, stroke_width]
    }

    unblockAudio() {
        var i, player
        for (i = 0; i < this.nodes.length; i++) {
            player = document.getElementById('page-audio-' + this.nodes[i].id)
            player.play()
            player.pause()
            player.currentTime = 0
        }
    }

    startFcn() {
        this.unblockAudio()
        this.layout()
        this.draw()
        this.setupHover()
        this.setupDrag()
        this.start_btn.disabled = true
        this.time_0 = Date.now()
    }

    readyFcn() {
        this.submit_btn.disabled = false
    }

    submitFcn() {
        var results = []
        for (var i = 0; i < this.nodes.length; i++) {
            var x = (this.nodes[i].x - this.h) / this.r / 2
            var y = (this.nodes[i].y - this.k) / this.r / 2
            results.push({
                'id': this.nodes[i].id, 'audiofile': this.nodes[i].audiofile,
                'values': [x, y],
                'num_speakers': this.num_speakers
            })
        }
        this.submitResults({
            'type': 'circle', 'trial_id': this.trial_id,
            'ratingtype': 'similarity', labels: '',
            'results': results, 'time': Date.now() - this.time_0
        },
            this.nextURL)
    }

    build() {
        if (this.buttonContainerId.length == 0) {
            this.startFcn()
        } else {
            this.start_btn = document.createElement("BUTTON");
            this.start_btn.innerHTML = 'Start'
            this.start_btn.className += this.buttonClass
            this.start_btn.addEventListener("click", this.startFcn.bind(this))

            this.submit_btn = document.createElement("BUTTON");
            this.submit_btn.innerHTML = 'Submit'
            this.submit_btn.className += this.buttonClass
            this.submit_btn.disabled = true
            this.submit_btn.addEventListener("click", this.submitFcn.bind(this))

            document.getElementById(this.buttonContainerId).appendChild(this.start_btn)
            document.getElementById(this.buttonContainerId).appendChild(this.submit_btn)
        }
    }

    setupAudio() {
        const tracks = []
        var player_id
        for (var i = 0; i < this.num_items; i++) {
            player_id = 'page-audio-' + this.nodes[i].id
            if (!!document.getElementById(player_id)) {
                console.log('audiofile id already loaded')
            } else {
                document.getElementById(this.audioContainerId).innerHTML += '<audio id="' + player_id + '"></audio>'
                if (this.nodes[i].audiofile.length > 0) {
                    showPlaybackTools(this.nodes[i].audiofile, this.nodes[i].id, this.loop)
                } else {
                    requestAudio(this.nodes[i].id)
                }
            }
        }
    }

    layout() {
        var alphas = makeArray(-3.141592653589793, 3.141592653589793, this.num_items + 1).slice(1,)
        this.links = []
        var i, j, link
        for (i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].x == '') {
                this.nodes[i].x = Math.sin(alphas[i]) * (this.r + 15) + this.k
                this.nodes[i].y = Math.cos(alphas[i]) * (this.r + 15) + this.h
            }
            for (j = i + 1; j < this.nodes.length; j++) {
                link = { source: i, target: j }
                this.links.push(link)
            }
        }
    }

    drawBorder(svg) {
        var borderPath = svg.append("circle")
            .attr('id', this.parentID + '-drop-box')
            .attr("cx", this.h)
            .attr("cy", this.k)
            .attr("r", this.r)
            .style("stroke", 'black')
            .style("fill", "none")
    }

    colorSelect(self, i, colorpalette) {
        return colorpalette(i)
    }

    draw() {

        var edgeUpdate = this.edgeUpdate
        // var edgeHide = this.edgeHide

        var html = '<svg id="' + this.parentId + '-svg" width="' + this.width + '" height="' + this.height + '">'
        document.getElementById(this.parentId).innerHTML += html
        this.svg = document.getElementById(this.parentId + '-svg')

        var svg = d3.select('#' + this.parentId + '-svg')

        this.drawBorder(svg)

        var nodes = this.nodes
        var links = this.links

        var self = this

        var colorpalette = this.get_colorpalette(self)

        this.edges = this.draw_edgelines(self, svg)
        this.circles = this.draw_nodes(self, svg)

        this.svg = svg

    }

    get_colorpalette(self) {
        return d3.scaleOrdinal(d3.schemeCategory20);
    }

    draw_edgelines(self, svg) {
        var edges = svg.selectAll("link")
            .data(self.links)
            .enter()
            .append("line")
            .attr("class", "link")
            .attr("x1", function (l) {
                var sourceNode = self.nodes.filter(function (d, i) {
                    return i == l.source
                })[0];
                d3.select(this).attr("y1", sourceNode.y);
                return sourceNode.x
            })
            .attr("x2", function (l) {
                var targetNode = self.nodes.filter(function (d, i) {
                    return i == l.target
                })[0];
                d3.select(this).attr("y2", targetNode.y);
                return targetNode.x
            })
            .attr("fill", "none")
            .attr("stroke-width", 1)
            .attr("stroke", "rgba(0,0,0,0)");
        return edges
    }

    draw_nodes(self, svg) {
        var circles = svg.selectAll("node")
            .data(self.nodes).enter()
            .append("circle")
            .attr("class", "node")
            .attr("cx", function (d) { return d.x })
            .attr("cy", function (d) { return d.y })
            .attr("fill", function (d, i) { return "Tomato" })
            .attr("id", function (d) { return d.id })
            .attr("r", function (d, i) { return self.circle_size_1(self, d) })
            .style("opacity", this.opacity)
            .style("stroke", 'black')
            .style("stroke-width", self.style.border_width_1)
        return circles
    }

    num_colors() {
        return this.num_items
    }

    setupHover() {
        var style = this.style
        var self = this

        var svg = d3.select('#' + self.parentId + '-svg')
        var circles = svg.selectAll('.node')

        circles.on("mouseover", function (d, i) {
            self.mouseover(self, this, style, d, i)
        })

        circles.on("mouseout", function (d) {
            self.mouseout(self, this, style, d)
        })

    }

    mouseover(self, circle, style, d, i) {
        self.hovered = i
        self.d_next = d
        self.circle_next = circle
        if ((self.play) & (self.highlighted == -1) & (!self.is_dragged)) {
            if (self.player) {
                self.player.pause()
            }
            self.player = document.getElementById("page-audio-" + circle.id)
            self.highlighted = i
            self.player.play()
            d3.select(circle)
                .attr("r", self.circle_size_2(self, d))
                .style("stroke", style.border_color_2)
                .style("stroke-width", style.border_width_2)
        }
        if (self.edge_on_hover) {
            self.edgeShow(self, d, i, d.x, d.y)
        }
    }

    mouseout(self, circle, style, d) {
        self.player = document.getElementById("page-audio-" + circle.id)
        if ((self.highlighted == self.hovered) & (!self.is_dragged)) {
            self.player.pause()
            self.highlighted = -1
            d3.select(circle)
                .attr("r", self.circle_size_1(self, d))
                .style("stroke", style.border_color_1)
                .style("stroke-width", style.border_width_1)
            d3.selectAll('.node')
                .filter(function (dd) { return dd.audioindex == d.audioindex; })
                .style("opacity", this.opacity)
        }
        self.hovered = -1
        if (self.all_in(self)) {
            self.readyFcn()
        }
    }

    boundary(self, x, y, i) {
        var a = (y - self.k)
        var b = (x - self.h)
        var ro = Math.sqrt(a ** 2 + b ** 2)
        if (ro > self.r) {
            var alpha = Math.atan(a / b)
            var xnew = Math.cos(alpha) * Math.sign(b) * self.r + self.h
            var ynew = Math.sin(alpha) * Math.sign(b) * self.r + self.k
        } else {
            var xnew = x
            var ynew = y
        }
        return [xnew, ynew]
    }

    is_in(self, x, y) {
        var a = (y - self.k)
        var b = (x - self.h)
        var ro = Math.sqrt(a ** 2 + b ** 2)
        return Math.floor(ro) <= self.r
    }

    all_in(self) {
        var is_done = true
        var i = 0
        while (is_done & (i < self.nodes.length)) {
            var circle = document.getElementById(String(self.nodes[i].id))
            var x = circle.cx.animVal.value
            var y = circle.cy.animVal.value
            is_done = self.is_in(self, x, y)
            i++
        }
        return is_done
    }

    setupDrag() {
        var circles = this.circles
        var self = this

        circles.call(d3.drag()
            .on("start", function (d) {
                self.dragstarted(self, this, d)
            })
            .on("drag", function (d, i) {
                self.dragged(self, this, d, i)
            })
            .on("end", function (d, i) {
                self.dragended(self, this, d, i)
            })
        );
    }

    dragstarted(self, circle, d) {
        d3.select(circle).raise().classed("active", true);
        self.is_dragged = true
    }

    dragged(self, circle, d, i) {
        var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
        d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1]);
        self.edgeUpdate(self, d, i, newpos[0], newpos[1])
    }

    dragended(self, circle, d, i) {
        d3.select(circle).classed("active", false);
        var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
        d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1])
        self.edgeUpdate(self, d, i, newpos[0], newpos[1])
        // self.edgeHide(self)
        if (self.all_in(self)) {
            self.readyFcn()
        }
        self.handle_dragend(self, circle, d, i)
    }

    handle_dragend(self, circle, d, i) {
        self.is_dragged = false
        if (self.highlighted != self.hovered) {
            var next = self.hovered
            self.hovered = self.highlighted
            self.mouseout(self, circle, self.style, d)
            if (next != -1) {
                var selection = self.svg.selectAll('.node')
                self.mouseover(self, self.circle_next, self.style, self.d_next, next)
            }
        }
    }

    getStroke(self, edge, l, i) {
        if (self.draw_edges) {
            if ((l.source == i) | (l.target == i)) {
                var weight = (edgeLength(edge) / self.max_len)
                var stroke = 'rgba(0,0,0,' + String(Math.max(1 - weight, .1)) + ')'
                var stroke_width = Math.max(4 - weight * 4, .4)
            } else {
                var stroke = 'rgba(0,0,0,0)'
                var stroke_width = 1
            }
        } else {
            var stroke = 'rgba(0,0,0,0)'
            var stroke_width = 1
        }
        return [stroke, stroke_width]
    }

    edgeUpdate(self, d, i, x, y) {
        self.edges.each(function (l, li) {
            var stroke_params = self.getStroke(self, this, l, i)
            if (l.source == i) {
                d3.select(this).attr("x1", d.x = x).attr("y1", d.y = y);
            } else if (l.target == i) {
                d3.select(this).attr("x2", d.x = x).attr("y2", d.y = y);
            }
            d3.select(this).attr("stroke", stroke_params[0])
            d3.select(this).attr("stroke-width", stroke_params[1])
        });

    }

    edgeShow(self, d, i, x, y) {
        self.edges.each(function (l, li) {
            var stroke_params = self.getStroke(self, this, l, i)
            d3.select(this).attr("stroke", stroke_params[0])
            d3.select(this).attr("stroke-width", stroke_params[1])
        });
    }

    edgeHide(self) {
        self.edges.each(function (l, li) {
            d3.select(this).attr("stroke", 'rgba(0,0,0,0)')
        });
    }

    addText(x, y, text, font_size = 15, anchor = 'middle', vanchor = 'central') {
        this.svg.innerHTML += '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" ' +
            'alignment-baseline="' + vanchor + '" font-family="sans-serif" ' +
            'font-size="' + font_size + 'px">' + text + '</text>'
    }

}

class CircleSortGraph extends AudioGraph {

    constructor(data, parentId, audioContainerId, buttonContainerId = '',
        draw_edges = true, trial_id = '', width = 400, nextURL = '',
        loop = true, num_speakers = 1, isJsPsych = true) {
        super(data, parentId, audioContainerId, buttonContainerId,
            draw_edges, trial_id, width, nextURL, loop, num_speakers, isJsPsych)
        this.num_in = 0
        this.num_clusters = 0
        this.last_cluster = 0
        this.clusterIndex = Array(self.num_items)
    }

    get_num_in(self) {
        var num = 0
        for (var j = 0; j < self.nodes.length; j++) {
            if (self.is_in(self, self.nodes[j].x, self.nodes[j].y)) {
                num += 1
            }
        }
        return num
    }

    update_clusters(self, i) {
        var nn = self.getNearestNeighbor(self, i)
        // if nn is in a cluster already, put i in it
        if (self.clusterIndex[nn]) {
            self.clusterIndex[i] = self.clusterIndex[nn]
        } else { // if not, create new cluster
            self.clusterIndex[i] = self.last_cluster + 1
            self.last_cluster += 1
        }
        // update number of clusters
        self.num_clusters = self.clusterIndex.filter(onlyUnique).length
    }

    dragged(self, circle, d, i) {
        var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
        d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1]);
        self.edgeUpdateDrag(self, d, i, newpos[0], newpos[1])
    }

    dragended(self, circle, d, i) {
        d3.select(circle).classed("active", false);
        var newpos = self.boundary(self, d3.event.x, d3.event.y, i)
        d3.select(circle).attr("cx", d.x = newpos[0]).attr("cy", d.y = newpos[1])
        self.nodes[i].x = newpos[0]
        self.nodes[i].y = newpos[1]
        self.edgeUpdate(self, d, i, newpos[0], newpos[1])
        self.num_in = self.get_num_in(self)
        self.update_clusters(self, i)
        //self.edgeHide(self)
        self.edgeUpdateDrag(self, d, i, newpos[0], newpos[1])
        self.min_len = Math.max(40, self.max_len / (1 + self.num_in))
        if (self.all_in(self)) {
            self.readyFcn()
        }
        self.handle_dragend(self, circle, d, i)
    }

    getNearestNeighbor(self, i) {
        var min_len = self.min_len
        var nn = self.nodes.length + 1
        var len
        for (var j = 0; j < self.nodes.length; j++) {
            if ((j != i) & self.is_in(self, self.nodes[j].x, self.nodes[j].y)) {
                len = computeLength(self.nodes[i].x, self.nodes[j].x, self.nodes[i].y, self.nodes[j].y)
                if (len < min_len) {
                    min_len = len
                    nn = j
                }
            }
        }
        return nn
    }

    edgeUpdateDrag(self, d, i, x, y) {
        var nn = self.getNearestNeighbor(self, i)
        var cluster = self.clusterIndex[nn]
        self.edges.each(function (l, li) {
            if (l.source == i) {
                d3.select(this).attr("x1", d.x = x).attr("y1", d.y = y);
            } else if (l.target == i) {
                d3.select(this).attr("x2", d.x = x).attr("y2", d.y = y);
            }
            if (
                (cluster > 0) &
                (
                    ((self.clusterIndex[l.target] == cluster) & (self.clusterIndex[l.source] == cluster)) |
                    ((l.target == i) & (self.clusterIndex[l.source] == cluster)) |
                    ((self.clusterIndex[l.target] == cluster) & (l.source == i))
                )) {
                var stroke_params = self.getStrokeOn()
            } else {
                var stroke_params = self.getStrokeOff()
            }
            d3.select(this).attr("stroke", stroke_params[0])
            d3.select(this).attr("stroke-width", stroke_params[1])
        });
    }

    submitFcn() {
        var results = []
        for (var i = 0; i < this.nodes.length; i++) {
            results.push({
                'id': this.nodes[i].id, 'audiofile': this.nodes[i].audiofile,
                'values': [this.clusterIndex[i]],
                'num_speakers': this.num_speakers
            })
        }
        this.submitResults({
            'type': 'circlesort', 'trial_id': this.trial_id,
            'ratingtype': 'cluster', 'labels': [''],
            'results': results, 'time': Date.now() - this.time_0
        },
            this.nextURL)
    }

}

function edgeLength(edge) {
    x1 = edge.x1.animVal.value
    x2 = edge.x2.animVal.value
    y1 = edge.y1.animVal.value
    y2 = edge.y2.animVal.value
    return computeLength(x1, x2, y1, y2)
}

function computeLength(x1, x2, y1, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

function showPlaybackTools(data, audiofile_id, loop) {
    // Audio Player
    let url;
    if (data instanceof Blob) {
        const blob = new Blob(data, { type: mimeType });
        url = (URL.createObjectURL(blob));
    } else {
        url = data;
    }
    let player = document.getElementById("page-audio-" + audiofile_id)
    player.src = url;
    player.loop = loop
}

function requestAudio(audiofile_id, url = "") {
    if (url.length == 0) {
        var audio_url = window.location.origin + '/get_audio'
    } else {
        var audio_url = url + '/get_audio'
    }
    $.ajax({
        url: audio_url,
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(
            { 'audiofile_id': audiofile_id }
        ),
        processData: false,
        success: function (data, textStatus, jQxhr) {
            showPlaybackTools(data.audio.type + ';' + data.audio.data, audiofile_id, true)
        },
        error: function (jqXhr, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function makeArray(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
        arr.push(startValue + (step * i));
    }
    return arr;
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function closest(x, y, xpos, ypos, max = 1e6) {
    var distance = max
    var xsel, ysel
    for (i = 0; i < xpos.length; i++) {
        for (j = 0; j < ypos.length; j++) {
            d = Math.sqrt((x - xpos[i]) ** 2 + (y - ypos[j]) ** 2)
            if (d < distance) {
                distance = d
                xsel = i
                ysel = j
            }
        }
    }
    return [xsel, ysel]
}

function requestAudioFiles(sentence_id, num_audiofiles, readyFcn) {
    var request_url = window.location.origin + '/get_audiofiles_sentence'
    var data = JSON.stringify(
        {
            'sentence_id': sentence_id,
            'num_audiofiles': num_audiofiles
        }
    )
    $.ajax({
        url: request_url,
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: data,
        processData: false,
        success: function (audiofile_ids, textStatus, jQxhr) {
            document.getElementById('audiofile-ids').innerHTML = JSON.stringify(audiofile_ids)
            readyFcn(audiofile_ids)
        },
        error: function (jqXhr, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function submitResults(results, nextURL = '') {
    var submit_url = window.location.origin + '/post_trial'
    $.ajax({
        url: submit_url,
        dataType: 'json',
        type: 'post',
        contentType: 'application/json',
        data: JSON.stringify(results),
        processData: false,
        success: function (data, textStatus, jQxhr) {
            if (nextURL == '') {
                location.reload();
            } else {
                window.location.href = nextURL
            }
        },
        error: function (jqXhr, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
}

function submitResultsJsPsych(results, nextURL) {
    // end trial
    // 'nextURL' variable is used to pass 'display_element' from jsPsych...

    var trial_data = {
        stimuli: [],
        ratings: [],
        rt: results.time,
        ratingtype: results.ratingtype,
        labels: results.labels
    }
    for (var i = 0; i < results.results.length; i++) {
        trial_data.stimuli.push(results.results[i].audiofile)
        if (results.results[i].values.length == 1) {
            trial_data.ratings.push(results.results[i].values[0])
        } else {
            trial_data.ratings.push(results.results[i].values)
        }
    }

    // inform about correct groups
    let unique = [...new Set(trial_data.ratings)];
    alert("Du hast " + unique.length + " verschiedene Sprecher erkannt. Total sind es " + results.results[0].num_speakers + " Sprecher.");

    nextURL.innerHTML = '';
    jsPsych.finishTrial(trial_data);
}