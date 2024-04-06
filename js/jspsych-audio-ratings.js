/*
 * Example plugin template
 */

jsPsych.plugins["audio-ratings"] = (function () {

    var plugin = {};

    plugin.info = {
        name: "audio-ratings",
        parameters: {
            stimuli: {
                type: jsPsych.plugins.parameterType.OBJECT,
                default: ['file1.wav', 'file2.wav']
            },
            speakers: {
                type: jsPsych.plugins.parameterType.INT,
                default: 1
            },
            ratingtype: {
                type: jsPsych.plugins.parameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
                default: 'cluster' // 'features', 'cluster' or 'similarity'
            },
            // Parameter for ratingtype 'features' and 'categories'
            label: {
                type: jsPsych.plugins.parameterType.OBJECT,
                default: ['Feature to rate']
                // for multiple features use:
                // ['1st Feature to rate', '2nd Feature to rate', '3rd Feature to rate']
            },
            // Parameter for ratingtype 'features'
            anchors: {
                type: jsPsych.plugins.parameterType.OBJECT,
                default: [['low', 'medium', 'high']]
                // for multiple features use:
                // [['low', 'medium', 'high'],
                //  ['low', 'medium', 'high'],
                //  ['low', 'medium', 'high']]
            }
        }
    }

    plugin.trial = function (display_element, trial) {

        var height = 600
        var width = 600

        var html = ''
        html += '<div class="container" style="margin-bottom:25px">'
        html += '<div class="d-flex justify-content-center">'
        html += '<p>Gruppiere die Stimmen (farbige Punkte) nach Sprecheridentit&auml;ten.</p>'
        html += '<p>Aufnahmen mit einem Verbindungsstrich geh&ouml;ren zur gleichen Person.</p>'
        html += '<p>Die Verbindung wird f&uuml;r den momentan aktiven Sprecher gezeigt, gelten aber weiterhin.</p>'
        html += '<div id="button-container" class="btn-group" style="margin-bottom:25px">'
        html += '</div>'
        html += '</div>'
        html += '</div>'
        html += '<div class="container" style="margin-bottom:25px">'
        html += '<div class="d-flex justify-content-center">'
        html += '<div id="plot-speakers-div">'
        html += '<svg id="plot-speakers" width="' + width + '" height="' + height + '">'
        html += '</div>'
        html += '</div>'
        html += '<div id="audio-container"></div>'

        display_element.innerHTML = html

        var num_files = trial.stimuli.length
        data = { 'nodes': [] }
        for (i = 0; i < num_files; i++) {
            data.nodes.push({
                'id': 'item-' + String(i), 'audiofile': trial.stimuli[i],
                'x': [], 'y': []
            })
        }

        var graph = new CircleSortGraph(data, 'plot-speakers', 'audio-container',
            buttonContainerId = 'button-container',
            draw_edges = true, trial_id = '', width = width,
            nextURL = display_element, loop = true,
            num_speakers = trial.speakers, isJsPsych = true
        )

        graph.build()

    };

    return plugin;
})();