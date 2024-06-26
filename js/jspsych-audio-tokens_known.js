var jsPsychAudioTokens = (function (jspsych) {
  "use strict";

  const info = {
    name: "audio-tokens",
    parameters: {
      stimuli: {
        type: jspsych.ParameterType.OBJECT,
        default: ['file1.wav', 'file2.wav']
      },
      num_speakers: {
        type: jspsych.ParameterType.INT,
        default: 0
      },
      ratingtype: {
        type: jspsych.ParameterType.STRING, // BOOL, STRING, INT, FLOAT, FUNCTION, KEY, SELECT, HTML_STRING, IMAGE, AUDIO, VIDEO, OBJECT, COMPLEX
        default: 'cluster' // 'features', 'cluster' or 'similarity'
      },
      // Parameter for ratingtype 'features' and 'categories'
      label: {
        type: jspsych.ParameterType.OBJECT,
        default: ['Feature to rate']
        // for multiple features use:
        // ['1st Feature to rate', '2nd Feature to rate', '3rd Feature to rate']
      },
      // Parameter for ratingtype 'features'
      anchors: {
        type: jspsych.ParameterType.OBJECT,
        default: [['low', 'medium', 'high']]
        // for multiple features use:
        // [['low', 'medium', 'high'],
        //  ['low', 'medium', 'high'],
        //  ['low', 'medium', 'high']]
      },
      force_listen: {
        type: jspsych.ParameterType.BOOL,
        default: false
      },
      loop: {
        type: jspsych.ParameterType.BOOL,
        default: true
      },
      draw_edges: {
        type: jspsych.ParameterType.BOOL,
        default: true
      },
      /** Any content here will be displayed below the stimulus. */
      prompt: {
        type: jspsych.ParameterType.HTML_STRING,
        pretty_name: "Prompt",
        default: null,
      },
      mute_key: {
        type: jspsych.ParameterType.KEYS,
        default: ''
        // to enable a mute key, enter a key here, e.g. 's'
      }
    },
  };

  /**
   * **PLUGIN-NAME**
   *
   * SHORT PLUGIN DESCRIPTION
   *
   * @author YOUR NAME
   * @see {@link https://DOCUMENTATION_URL DOCUMENTATION LINK TEXT}
   */
  class PluginNamePlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }
    trial(display_element, trial) {
      // Set defaults
      if (trial.force_listen) {
        trial.opacity = .5
      } else {
        trial.opacity = 1.
      }
      trial.width = 500
      trial.trial_id = ''
      trial.nextURL = display_element
      if (trial.ratingtype == 'categories') {
        trial.item_spacing = 12.5
      } else {
        trial.item_spacing = 7.5
      }
      trial.jsPsych = this.jsPsych

      var height = {
        'features': 150 * trial.label.length,
        'cluster': 500,
        'similarity': 400,
        'features2d': 375,
        'categories': 225,
        'triplets': 150
      }

      // Generate html string
      var html = ''
      html += '<div class="container" style="margin-bottom:25px">'
      html += '<div class="d-flex container">'
      html += '<p>Die Aufnahmen (blaue Punkte) geh&ouml;ren zu 3 unterschiedlichen Sprechern. Gruppiere sie.</p>'
      html += '<p>Aufnahmen mit einem Verbindungsstrich werden zur gleichen Person gez&auml;hlt.</p>'
      html += '<p>Klicke auf "ENDE", wenn du mit der Aufgabe fertig bist.</p>'
      html += '</div>'
      html += '<div id="button-container" class="btn-group" style="margin-bottom:25px">'
      html += '</div>'
      html += '</div>'
      html += '<div class="container" style="margin-bottom:25px">'
      html += '<div class="d-flex justify-content-center">'
      html += '<div id="plot-speakers-div">'
      html += '<svg id="plot-speakers" width="500" height="' + height[trial.ratingtype] + '">'
      html += '</div>'
      html += '</div>'
      html += '<div id="audio-container"></div>'

      //show prompt if there is one
      if (trial.prompt !== null) {
        html += trial.prompt;
      }

      display_element.innerHTML = html

      // Generate data for graph
      var i
      var num_files = trial.stimuli.length
      var data = { 'nodes': [] }
      for (i = 0; i < num_files; i++) {
        data.nodes.push({
          'id': 'item-' + String(i),
          'audiofile': trial.stimuli[i],
          'x': [], 'y': []
        })
      }

      // Generate graph
      var graph = new CircleSortGraph(
        data, 'plot-speakers', 'audio-container', 'button-container', true, trial
      )

      // Show graph
      graph.build()
    }
  }
  PluginNamePlugin.info = info;

  return PluginNamePlugin;
})(jsPsychModule);